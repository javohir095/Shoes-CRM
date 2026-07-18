-- =========================================================
-- MIGRATION 0003: Customer Reviews / Rating System
-- + estimated_ready_at field on orders
-- + worker rating aggregation
-- =========================================================

-- ---------------------------------------------------------
-- 1. orders: estimated ready date (taxminiy tayyor bo'lish sanasi)
-- ---------------------------------------------------------
alter table public.orders
  add column if not exists estimated_ready_at timestamptz,
  add column if not exists customer_id uuid references public.telegram_users(id) on delete set null;

create index if not exists idx_orders_customer on public.orders(customer_id);

-- ---------------------------------------------------------
-- 2. REVIEWS (Mijoz baholash)
-- ---------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  worker_id uuid references public.users(id) on delete set null,
  customer_id uuid references public.telegram_users(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id) -- har bir buyurtma uchun faqat bitta baho
);

create index if not exists idx_reviews_company on public.reviews(company_id);
create index if not exists idx_reviews_order on public.reviews(order_id);
create index if not exists idx_reviews_worker on public.reviews(worker_id);
create index if not exists idx_reviews_customer on public.reviews(customer_id);
create index if not exists idx_reviews_rating on public.reviews(rating);

comment on table public.reviews is 'Mijozlarning buyurtma bo''yicha bahosi va izohi';

-- ---------------------------------------------------------
-- 3. WORKER RATING STATS (worker_balances'ga qo'shimcha ustunlar)
-- worker_balances jadvalini reyting bilan kengaytiramiz
-- ---------------------------------------------------------
alter table public.worker_balances
  add column if not exists avg_rating numeric(3,2) not null default 0,
  add column if not exists total_reviews integer not null default 0,
  add column if not exists rating_5_count integer not null default 0,
  add column if not exists rating_4_count integer not null default 0,
  add column if not exists rating_3_count integer not null default 0,
  add column if not exists rating_2_count integer not null default 0,
  add column if not exists rating_1_count integer not null default 0,
  add column if not exists on_time_orders integer not null default 0,
  add column if not exists total_orders integer not null default 0;

-- ---------------------------------------------------------
-- 4. TRIGGER: review qo'shilganda worker_balances reyting yangilanadi
-- ---------------------------------------------------------
create or replace function public.apply_review_to_worker_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_col text;
begin
  -- worker_balances yozuvi mavjudligini ta'minlash
  insert into public.worker_balances (worker_id, company_id)
  values (new.worker_id, new.company_id)
  on conflict (worker_id) do nothing;

  -- mos yulduz ustunini aniqlash va +1 qilish
  v_col := 'rating_' || new.rating::text || '_count';

  execute format(
    'update public.worker_balances
       set %I = %I + 1,
           total_reviews = total_reviews + 1,
           updated_at = now()
     where worker_id = $1',
    v_col, v_col
  ) using new.worker_id;

  -- o'rtacha bahoni qayta hisoblash
  update public.worker_balances
  set avg_rating = round(
    (
      (rating_1_count * 1) + (rating_2_count * 2) + (rating_3_count * 3) +
      (rating_4_count * 4) + (rating_5_count * 5)
    )::numeric / greatest(total_reviews, 1),
    2
  )
  where worker_id = new.worker_id;

  return new;
end;
$$;

drop trigger if exists trg_apply_review_to_worker_stats on public.reviews;
create trigger trg_apply_review_to_worker_stats
  after insert on public.reviews
  for each row
  when (new.worker_id is not null)
  execute function public.apply_review_to_worker_stats();

-- ---------------------------------------------------------
-- 5. TRIGGER: order tugallanganda/topshirilganda total_orders va
--    on_time_orders yangilanadi (estimated_ready_at bo'yicha)
-- ---------------------------------------------------------
create or replace function public.apply_order_completion_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'topshirildi' and (old.status is distinct from new.status) and new.worker_id is not null then

    insert into public.worker_balances (worker_id, company_id)
    values (new.worker_id, new.company_id)
    on conflict (worker_id) do nothing;

    update public.worker_balances
    set total_orders = total_orders + 1,
        on_time_orders = on_time_orders + (
          case
            when new.estimated_ready_at is null then 1
            when now() <= new.estimated_ready_at then 1
            else 0
          end
        ),
        updated_at = now()
    where worker_id = new.worker_id;

  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_order_completion_stats on public.orders;
create trigger trg_apply_order_completion_stats
  after update on public.orders
  for each row
  execute function public.apply_order_completion_stats();

-- ---------------------------------------------------------
-- 6. ENABLE RLS on reviews
-- ---------------------------------------------------------
alter table public.reviews enable row level security;

drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews
  for select using (
    public.is_super_admin()
    or company_id = public.current_user_company()
  );

drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews
  for insert with check (
    public.is_super_admin()
    or company_id = public.current_user_company()
    or true -- Telegram bot service role orqali yozadi
  );

-- Reviews o'zgartirib/o'chirib bo'lmaydi (audit uchun) - admin ham yo'q
-- super_admin uchun ham update/delete policy kiritilmagan -> bloklangan default

-- ---------------------------------------------------------
-- 7. VIEW: Customer Satisfaction Dashboard widget uchun
-- ---------------------------------------------------------
create or replace view public.company_satisfaction_stats as
select
  c.id as company_id,
  c.name as company_name,
  coalesce(round(avg(r.rating)::numeric, 2), 0) as avg_rating,
  count(r.id) as total_reviews,
  (
    select u.id from public.users u
    join public.worker_balances wb on wb.worker_id = u.id
    where u.company_id = c.id and u.role = 'worker'
    order by wb.avg_rating desc, wb.total_reviews desc
    limit 1
  ) as best_worker_id
from public.companies c
left join public.reviews r on r.company_id = c.id
group by c.id, c.name;

-- ---------------------------------------------------------
-- 8. TOP WORKERS RANKING VIEW (rating + earning + orders combined)
-- ---------------------------------------------------------
create or replace view public.worker_rankings as
select
  u.id as worker_id,
  u.company_id,
  u.full_name,
  wb.total_orders,
  wb.on_time_orders,
  wb.total_earned,
  wb.avg_rating,
  wb.total_reviews,
  (
    coalesce(wb.total_orders, 0) * 1.0
    + coalesce(wb.total_earned, 0) / 10000.0
    + coalesce(wb.avg_rating, 0) * 20
    + coalesce(wb.on_time_orders, 0) * 0.5
  ) as score
from public.users u
left join public.worker_balances wb on wb.worker_id = u.id
where u.role = 'worker' and u.is_active = true
order by score desc;
