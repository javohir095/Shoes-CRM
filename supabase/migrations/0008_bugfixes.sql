-- ============================================================================
-- 0008: TZ §12 bug-fix schema changes
--   §12.3 — companies.bot_username (QR → Telegram deep link)
--   §12.4 — get_worker_rankings() role-scoped ranking RPC
--   §12.5 — salary_payments status/confirm workflow
-- Safe: additive only (IF NOT EXISTS / OR REPLACE), no drops of existing data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- §12.3 — bot username (so the frontend can build a t.me deep link)
-- ----------------------------------------------------------------------------

alter table companies add column if not exists bot_username text;

-- ----------------------------------------------------------------------------
-- §12.4 — role-scoped worker ranking RPC
-- Metrics derived from orders/status_history (not order_ratings, which has
-- no producer in the live app). SECURITY DEFINER so it can read across the
-- caller's permitted scope even though individual `orders` RLS is tighter
-- (workers only see their own orders) — the function itself enforces the
-- role-based scoping documented in TZ §8.1, and never leaks other workers'
-- individual figures to a `worker` caller.
-- ----------------------------------------------------------------------------

create or replace function get_worker_rankings()
returns table (
  worker_id           uuid,
  fullname            text,
  branch_id           uuid,
  company_id          uuid,
  completed_orders    bigint,
  total_revenue       numeric,
  customers_served    bigint,
  avg_completion_hours numeric,
  rank                bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role       user_role := auth_user_role();
  v_company_id uuid := auth_user_company_id();
  v_branch_id  uuid := auth_user_branch_id();
  v_uid        uuid := auth.uid();
begin
  if v_role is null then
    return;
  end if;

  return query
  with stats as (
    select
      u.id as worker_id,
      u.fullname,
      u.branch_id,
      u.company_id,
      count(o.id) filter (where o.status = 'topshirildi') as completed_orders,
      coalesce(sum(o.price) filter (where o.status = 'topshirildi'), 0) as total_revenue,
      count(distinct o.customer_phone) filter (where o.status = 'topshirildi') as customers_served,
      coalesce(avg(extract(epoch from (sh_done.created_at - sh_start.created_at)) / 3600.0)
        filter (where o.status = 'topshirildi'), 0) as avg_completion_hours
    from users u
    left join orders o on o.created_by = u.id
    left join lateral (
      select created_at from status_history
      where order_id = o.id and new_status = 'qabul_qilindi'
      order by created_at asc limit 1
    ) sh_start on true
    left join lateral (
      select created_at from status_history
      where order_id = o.id and new_status = 'topshirildi'
      order by created_at desc limit 1
    ) sh_done on true
    where u.role = 'worker'
      and (
        (v_role = 'super_admin')
        or (v_role = 'director' and u.company_id = v_company_id)
        or (v_role = 'admin' and u.branch_id = v_branch_id)
        or (v_role = 'worker' and u.company_id = v_company_id)
      )
    group by u.id, u.fullname, u.branch_id, u.company_id
  ),
  ranked as (
    select
      s.*,
      row_number() over (order by s.total_revenue desc, s.completed_orders desc) as rnk
    from stats s
  )
  select r.worker_id, r.fullname, r.branch_id, r.company_id,
         r.completed_orders, r.total_revenue, r.customers_served,
         r.avg_completion_hours, r.rnk
  from ranked r
  where v_role in ('super_admin', 'director', 'admin')
     or (v_role = 'worker' and r.worker_id = v_uid)
  order by r.rnk;
end;
$$;

grant execute on function get_worker_rankings() to authenticated;

-- ----------------------------------------------------------------------------
-- §12.5 — salary payment confirm-by-worker workflow
-- ----------------------------------------------------------------------------

alter table salary_payments
  add column if not exists status text not null default 'kutilmoqda'
    check (status in ('kutilmoqda', 'tasdiqlangan')),
  add column if not exists confirmed_at timestamptz;

-- Replace insert-time trigger with a confirm-time trigger: balance only
-- moves once the worker has confirmed receipt (TZ §7.2).
drop trigger if exists trg_update_salary_paid_amount on salary_payments;

create or replace function update_salary_paid_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'tasdiqlangan' and old.status is distinct from new.status then
    update employee_salaries set paid_amount = paid_amount + new.amount where id = new.salary_id;
  end if;
  return new;
end;
$$;

create trigger trg_update_salary_paid_amount
  after update of status on salary_payments
  for each row
  execute function update_salary_paid_amount();

-- Worker may transition their own payment rows from kutilmoqda -> tasdiqlangan only.
drop policy if exists "Workers confirm own salary payments" on salary_payments;

create policy "Workers confirm own salary payments"
  on salary_payments for update
  using (
    exists (
      select 1 from employee_salaries es
      where es.id = salary_payments.salary_id and es.employee_id = auth.uid()
    )
    and status = 'kutilmoqda'
  )
  with check (
    exists (
      select 1 from employee_salaries es
      where es.id = salary_payments.salary_id and es.employee_id = auth.uid()
    )
    and status = 'tasdiqlangan'
  );

SELECT 'Migration 0008 muvaffaqiyatli bajarildi! ✅' AS result;
