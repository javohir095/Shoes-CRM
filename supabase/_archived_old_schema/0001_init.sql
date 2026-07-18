-- =========================================================
-- SHOE CLEANING & RESTORATION ERP/POS SYSTEM
-- Initial migration: extensions, types, tables, indexes,
-- functions, triggers, RLS policies (RBAC)
-- =========================================================

-- ---------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------
do $$ begin
  create type user_role as enum ('super_admin', 'admin', 'worker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'qabul_qilindi',
    'diagnostika',
    'tozalanmoqda',
    'tamirlanmoqda',
    'tayyor',
    'topshirildi',
    'tugallangan',
    'bekor_qilindi'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum (
    'naqd', 'uzcard', 'humo', 'click', 'payme', 'bank_otkazma'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type service_type as enum (
    'tozalash', 'tamirlash', 'bo_yash', 'tozalash_va_tamirlash', 'boshqa'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'order_created', 'status_changed', 'order_ready', 'salary_paid', 'system'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- 2. COMPANIES (Tenants / Filiallar)
-- ---------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  legal_name text,
  phone text,
  address text,
  logo_url text,
  receipt_footer_text text,
  is_active boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.companies is 'Tenant / filial - har bir mustaqil biznes birligi';

-- ---------------------------------------------------------
-- 3. USERS (profile, links to auth.users)
-- ---------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'worker',
  percentage numeric(5,2) not null default 0, -- worker uchun foiz (masalan 40.00)
  avatar_url text,
  pin_code_hash text, -- ishchi balans tasdiqlash uchun parol hash
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Tizim foydalanuvchilari (super_admin, admin, worker)';

-- super_admin uchun company_id null bo'lishi mumkin (global)
create index if not exists idx_users_company on public.users(company_id);
create index if not exists idx_users_role on public.users(role);

-- ---------------------------------------------------------
-- 4. ORDERS
-- ---------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_number text not null unique, -- SH-YYYYMMDD-XXXX
  worker_id uuid references public.users(id) on delete set null,

  -- Mijoz ma'lumotlari
  customer_name text not null,
  customer_phone text not null,
  customer_telegram_id bigint,

  -- Buyurtma ma'lumotlari
  shoe_type text not null,
  brand text,
  color text,
  service_type service_type not null default 'tozalash',
  price numeric(12,2) not null default 0,
  comment text,

  -- Status
  status order_status not null default 'qabul_qilindi',

  -- To'lov
  payment_method payment_method,
  paid_at timestamptz,

  -- Worker daromad
  worker_percentage numeric(5,2),
  worker_earning numeric(12,2),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_company on public.orders(company_id);
create index if not exists idx_orders_worker on public.orders(worker_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_customer_phone on public.orders(customer_phone);
create index if not exists idx_orders_telegram_id on public.orders(customer_telegram_id);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_created_at on public.orders(created_at);

comment on table public.orders is 'Asosiy buyurtmalar jadvali';

-- ---------------------------------------------------------
-- 5. ORDER IMAGES
-- ---------------------------------------------------------
create table if not exists public.order_images (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  image_url text not null,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_images_order on public.order_images(order_id);

-- ---------------------------------------------------------
-- 6. STATUS HISTORY
-- ---------------------------------------------------------
create table if not exists public.status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status order_status,
  new_status order_status not null,
  changed_by uuid references public.users(id) on delete set null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_status_history_order on public.status_history(order_id);

-- ---------------------------------------------------------
-- 7. PAYMENTS (mijoz to'lovlari)
-- ---------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null,
  method payment_method not null,
  received_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_company on public.payments(company_id);
create index if not exists idx_payments_order on public.payments(order_id);

-- ---------------------------------------------------------
-- 8. WORKER BALANCES
-- ---------------------------------------------------------
create table if not exists public.worker_balances (
  id uuid primary key default uuid_generate_v4(),
  worker_id uuid not null references public.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  total_earned numeric(14,2) not null default 0,
  total_paid numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (worker_id)
);

create index if not exists idx_worker_balances_company on public.worker_balances(company_id);

-- ---------------------------------------------------------
-- 9. SALARY PAYMENTS (oylik to'lovlar)
-- ---------------------------------------------------------
create table if not exists public.salary_payments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  worker_id uuid not null references public.users(id) on delete cascade,
  amount numeric(14,2) not null,
  paid_by uuid references public.users(id) on delete set null,
  status text not null default 'pending', -- pending | confirmed
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_salary_payments_worker on public.salary_payments(worker_id);
create index if not exists idx_salary_payments_company on public.salary_payments(company_id);

-- ---------------------------------------------------------
-- 10. NOTIFICATIONS
-- ---------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  telegram_user_id bigint,
  type notification_type not null default 'system',
  title text,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_telegram on public.notifications(telegram_user_id);

-- ---------------------------------------------------------
-- 11. TELEGRAM USERS (mijozlar botda)
-- ---------------------------------------------------------
create table if not exists public.telegram_users (
  id uuid primary key default uuid_generate_v4(),
  telegram_id bigint not null unique,
  company_id uuid references public.companies(id) on delete cascade,
  phone text,
  full_name text,
  username text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_telegram_users_phone on public.telegram_users(phone);
create index if not exists idx_telegram_users_company on public.telegram_users(company_id);

-- =========================================================
-- 12. HELPER FUNCTIONS (RBAC + tenant isolation)
-- =========================================================

-- Joriy foydalanuvchi roli
create or replace function public.current_user_role()
returns user_role
language sql stable security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- Joriy foydalanuvchi company_id
create or replace function public.current_user_company()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select company_id from public.users where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_admin_or_above()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('super_admin', 'admin')
  );
$$;

-- =========================================================
-- 13. ORDER NUMBER GENERATOR (SH-YYYYMMDD-XXXX)
-- =========================================================
create or replace function public.generate_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date_part text;
  v_seq int;
  v_order_number text;
begin
  v_date_part := to_char(now(), 'YYYYMMDD');

  select coalesce(max(
    (regexp_match(order_number, 'SH-' || v_date_part || '-(\d{4})'))[1]::int
  ), 0) + 1
  into v_seq
  from public.orders
  where order_number like 'SH-' || v_date_part || '-%';

  v_order_number := 'SH-' || v_date_part || '-' || lpad(v_seq::text, 4, '0');

  -- ensure uniqueness in race conditions
  while exists (select 1 from public.orders where order_number = v_order_number) loop
    v_seq := v_seq + 1;
    v_order_number := 'SH-' || v_date_part || '-' || lpad(v_seq::text, 4, '0');
  end loop;

  new.order_number := v_order_number;
  return new;
end;
$$;

drop trigger if exists trg_generate_order_number on public.orders;
create trigger trg_generate_order_number
  before insert on public.orders
  for each row
  when (new.order_number is null or new.order_number = '')
  execute function public.generate_order_number();

-- =========================================================
-- 14. STATUS HISTORY TRIGGER
-- =========================================================
create or replace function public.log_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.status_history (order_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, new.worker_id);
    return new;
  end if;

  if (tg_op = 'UPDATE') and (old.status is distinct from new.status) then
    insert into public.status_history (order_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, new.worker_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_status_change on public.orders;
create trigger trg_log_status_change
  after insert or update on public.orders
  for each row
  execute function public.log_status_change();

-- =========================================================
-- 15. WORKER EARNING CALCULATION TRIGGER
-- Buyurtma "tugallangan" bo'lganda ishchi balansiga foiz qo'shiladi
-- =========================================================
create or replace function public.calculate_worker_earning()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_percentage numeric(5,2);
  v_earning numeric(12,2);
begin
  if new.status = 'tugallangan'
     and (old.status is distinct from new.status)
     and new.worker_id is not null then

    select percentage into v_percentage from public.users where id = new.worker_id;
    v_percentage := coalesce(v_percentage, 0);
    v_earning := round(new.price * v_percentage / 100, 2);

    new.worker_percentage := v_percentage;
    new.worker_earning := v_earning;

    insert into public.worker_balances (worker_id, company_id, total_earned, current_balance)
    values (new.worker_id, new.company_id, v_earning, v_earning)
    on conflict (worker_id) do update
      set total_earned = worker_balances.total_earned + v_earning,
          current_balance = worker_balances.current_balance + v_earning,
          updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_calculate_worker_earning on public.orders;
create trigger trg_calculate_worker_earning
  before update on public.orders
  for each row
  execute function public.calculate_worker_earning();

-- =========================================================
-- 16. SALARY PAYMENT CONFIRMATION -> balance update
-- =========================================================
create or replace function public.apply_salary_payment_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is distinct from new.status) then
    update public.worker_balances
      set total_paid = total_paid + new.amount,
          current_balance = current_balance - new.amount,
          updated_at = now()
      where worker_id = new.worker_id;

    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_salary_payment_confirmation on public.salary_payments;
create trigger trg_salary_payment_confirmation
  before update on public.salary_payments
  for each row
  execute function public.apply_salary_payment_confirmation();

-- =========================================================
-- 17. updated_at AUTO-UPDATE TRIGGER (generic)
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_telegram_users_updated_at on public.telegram_users;
create trigger trg_telegram_users_updated_at before update on public.telegram_users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_worker_balances_updated_at on public.worker_balances;
create trigger trg_worker_balances_updated_at before update on public.worker_balances
  for each row execute function public.set_updated_at();

-- =========================================================
-- 18. ENABLE RLS
-- =========================================================
alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.order_images enable row level security;
alter table public.status_history enable row level security;
alter table public.payments enable row level security;
alter table public.worker_balances enable row level security;
alter table public.salary_payments enable row level security;
alter table public.notifications enable row level security;
alter table public.telegram_users enable row level security;

-- =========================================================
-- 19. RLS POLICIES
-- =========================================================

-- ---------- COMPANIES ----------
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select using (
    public.is_super_admin() or id = public.current_user_company()
  );

drop policy if exists companies_insert on public.companies;
create policy companies_insert on public.companies
  for insert with check ( public.is_super_admin() );

drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies
  for update using (
    public.is_super_admin() or
    (public.current_user_role() = 'admin' and id = public.current_user_company())
  );

drop policy if exists companies_delete on public.companies;
create policy companies_delete on public.companies
  for delete using ( public.is_super_admin() );

-- ---------- USERS ----------
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (
    public.is_super_admin()
    or id = auth.uid()
    or (company_id = public.current_user_company() and public.is_admin_or_above())
  );

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert with check (
    public.is_super_admin()
    or (public.current_user_role() = 'admin'
        and company_id = public.current_user_company()
        and role in ('worker','admin'))
  );

drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (
    public.is_super_admin()
    or id = auth.uid()
    or (public.current_user_role() = 'admin' and company_id = public.current_user_company())
  );

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete using (
    public.is_super_admin()
    or (public.current_user_role() = 'admin' and company_id = public.current_user_company())
  );

-- ---------- ORDERS ----------
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders
  for select using (
    public.is_super_admin()
    or company_id = public.current_user_company()
  );

drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders
  for insert with check (
    public.is_super_admin()
    or company_id = public.current_user_company()
  );

drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders
  for update using (
    public.is_super_admin()
    or company_id = public.current_user_company()
  );

drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders
  for delete using (
    public.is_super_admin()
    or (public.current_user_role() = 'admin' and company_id = public.current_user_company())
  );

-- ---------- ORDER IMAGES ----------
drop policy if exists order_images_select on public.order_images;
create policy order_images_select on public.order_images
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_images.order_id
        and o.company_id = public.current_user_company()
    )
  );

drop policy if exists order_images_insert on public.order_images;
create policy order_images_insert on public.order_images
  for insert with check (
    public.is_super_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_images.order_id
        and o.company_id = public.current_user_company()
    )
  );

drop policy if exists order_images_delete on public.order_images;
create policy order_images_delete on public.order_images
  for delete using (
    public.is_super_admin()
    or (public.is_admin_or_above() and exists (
      select 1 from public.orders o
      where o.id = order_images.order_id
        and o.company_id = public.current_user_company()
    ))
  );

-- ---------- STATUS HISTORY ----------
drop policy if exists status_history_select on public.status_history;
create policy status_history_select on public.status_history
  for select using (
    public.is_super_admin()
    or exists (
      select 1 from public.orders o
      where o.id = status_history.order_id
        and o.company_id = public.current_user_company()
    )
  );

drop policy if exists status_history_insert on public.status_history;
create policy status_history_insert on public.status_history
  for insert with check (
    public.is_super_admin()
    or exists (
      select 1 from public.orders o
      where o.id = status_history.order_id
        and o.company_id = public.current_user_company()
    )
  );

-- ---------- PAYMENTS ----------
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (
    public.is_super_admin()
    or company_id = public.current_user_company()
  );

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert with check (
    public.is_super_admin()
    or company_id = public.current_user_company()
  );

-- ---------- WORKER BALANCES ----------
drop policy if exists worker_balances_select on public.worker_balances;
create policy worker_balances_select on public.worker_balances
  for select using (
    public.is_super_admin()
    or worker_id = auth.uid()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

drop policy if exists worker_balances_update on public.worker_balances;
create policy worker_balances_update on public.worker_balances
  for update using (
    public.is_super_admin()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

drop policy if exists worker_balances_insert on public.worker_balances;
create policy worker_balances_insert on public.worker_balances
  for insert with check (
    public.is_super_admin()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

-- ---------- SALARY PAYMENTS ----------
drop policy if exists salary_payments_select on public.salary_payments;
create policy salary_payments_select on public.salary_payments
  for select using (
    public.is_super_admin()
    or worker_id = auth.uid()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

drop policy if exists salary_payments_insert on public.salary_payments;
create policy salary_payments_insert on public.salary_payments
  for insert with check (
    public.is_super_admin()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

drop policy if exists salary_payments_update on public.salary_payments;
create policy salary_payments_update on public.salary_payments
  for update using (
    public.is_super_admin()
    or worker_id = auth.uid()  -- ishchi o'z to'lovini tasdiqlashi uchun
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

-- ---------- NOTIFICATIONS ----------
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (
    public.is_super_admin()
    or user_id = auth.uid()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (
    public.is_super_admin()
    or company_id = public.current_user_company()
    or company_id is null -- service role / bot orqali
  );

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update using (
    public.is_super_admin()
    or user_id = auth.uid()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

-- ---------- TELEGRAM USERS ----------
drop policy if exists telegram_users_select on public.telegram_users;
create policy telegram_users_select on public.telegram_users
  for select using (
    public.is_super_admin()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
  );

drop policy if exists telegram_users_insert on public.telegram_users;
create policy telegram_users_insert on public.telegram_users
  for insert with check ( true ); -- bot service role orqali yozadi

drop policy if exists telegram_users_update on public.telegram_users;
create policy telegram_users_update on public.telegram_users
  for update using (
    public.is_super_admin()
    or (public.is_admin_or_above() and company_id = public.current_user_company())
    or true -- bot service role orqali yangilaydi
  );

-- =========================================================
-- 20. STORAGE BUCKETS (order images, receipts, logos)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('order-images', 'order-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "order_images_storage_select" on storage.objects;
create policy "order_images_storage_select" on storage.objects
  for select using ( bucket_id = 'order-images' );

drop policy if exists "order_images_storage_insert" on storage.objects;
create policy "order_images_storage_insert" on storage.objects
  for insert with check ( bucket_id = 'order-images' and auth.role() = 'authenticated' );

drop policy if exists "company_logos_storage_select" on storage.objects;
create policy "company_logos_storage_select" on storage.objects
  for select using ( bucket_id = 'company-logos' );

drop policy if exists "company_logos_storage_insert" on storage.objects;
create policy "company_logos_storage_insert" on storage.objects
  for insert with check ( bucket_id = 'company-logos' and auth.role() = 'authenticated' );

drop policy if exists "receipts_storage_select" on storage.objects;
create policy "receipts_storage_select" on storage.objects
  for select using ( bucket_id = 'receipts' );

drop policy if exists "receipts_storage_insert" on storage.objects;
create policy "receipts_storage_insert" on storage.objects
  for insert with check ( bucket_id = 'receipts' and auth.role() = 'authenticated' );

-- =========================================================
-- 21. AUTO-CREATE PROFILE ON SIGNUP (auth.users trigger)
-- =========================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, role, company_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'worker'),
    (new.raw_user_meta_data->>'company_id')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
