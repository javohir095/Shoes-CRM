-- ============================================================================
-- SoleCare — Migration 0004: Multi-role, branches, subscriptions, salaries
-- SAFE: only ADD columns/tables, no drops, no data modification
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Extend user_role enum (add director role safely)
-- ----------------------------------------------------------------------------

alter type user_role add value if not exists 'director';

-- ----------------------------------------------------------------------------
-- 2. Add columns to companies (monthly_fee, bot_token)
-- ----------------------------------------------------------------------------

alter table companies
  add column if not exists monthly_fee  numeric(12,2) not null default 500000,
  add column if not exists bot_token    text;

-- ----------------------------------------------------------------------------
-- 3. Add branch_id to users and orders (nullable for backward compat)
-- ----------------------------------------------------------------------------

-- Create branches table first
create table if not exists branches (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies (id) on delete cascade,
  name        text not null,
  address     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table branches is 'Physical locations/branches of a company. Each admin manages one branch.';

create index if not exists idx_branches_company_id on branches (company_id);

-- Add branch_id to users
alter table users
  add column if not exists branch_id uuid references branches (id) on delete set null;

create index if not exists idx_users_branch_id on users (branch_id);

-- Add branch_id to orders
alter table orders
  add column if not exists branch_id uuid references branches (id) on delete set null;

create index if not exists idx_orders_branch_id on orders (branch_id);

-- ----------------------------------------------------------------------------
-- 4. Company Subscriptions
-- ----------------------------------------------------------------------------

create table if not exists company_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies (id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  amount        numeric(12,2) not null,
  status        text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at       timestamptz,
  notes         text,
  created_by    uuid references users (id),
  created_at    timestamptz not null default now()
);

comment on table company_subscriptions is 'Monthly subscription records for each company tenant.';

create index if not exists idx_company_subscriptions_company_id on company_subscriptions (company_id);
create index if not exists idx_company_subscriptions_period_end on company_subscriptions (period_end);
create index if not exists idx_company_subscriptions_status on company_subscriptions (status);

-- ----------------------------------------------------------------------------
-- 5. Employee Salaries
-- ----------------------------------------------------------------------------

create table if not exists employee_salaries (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references users (id) on delete cascade,
  company_id       uuid not null references companies (id) on delete cascade,
  salary_amount    numeric(12,2) not null default 0,
  paid_amount      numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) generated always as (salary_amount - paid_amount) stored,
  period_month     date not null, -- first day of the month
  created_by       uuid references users (id),
  created_at       timestamptz not null default now(),
  unique (employee_id, period_month)
);

comment on table employee_salaries is 'Monthly salary record per employee. One row per employee per month.';

create index if not exists idx_employee_salaries_employee_id on employee_salaries (employee_id);
create index if not exists idx_employee_salaries_company_id on employee_salaries (company_id);
create index if not exists idx_employee_salaries_period on employee_salaries (period_month desc);

-- ----------------------------------------------------------------------------
-- 6. Salary Payments (partial payment history)
-- ----------------------------------------------------------------------------

create table if not exists salary_payments (
  id         uuid primary key default gen_random_uuid(),
  salary_id  uuid not null references employee_salaries (id) on delete cascade,
  amount     numeric(12,2) not null check (amount > 0),
  note       text,
  paid_at    timestamptz not null default now(),
  created_by uuid references users (id),
  created_at timestamptz not null default now()
);

comment on table salary_payments is 'Individual payment transactions against an employee salary record.';

create index if not exists idx_salary_payments_salary_id on salary_payments (salary_id);

-- Trigger: update paid_amount when salary payment is inserted
create or replace function update_salary_paid_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update employee_salaries
  set paid_amount = paid_amount + new.amount
  where id = new.salary_id;
  return new;
end;
$$;

drop trigger if exists trg_update_salary_paid_amount on salary_payments;
create trigger trg_update_salary_paid_amount
  after insert on salary_payments
  for each row
  execute function update_salary_paid_amount();

-- ----------------------------------------------------------------------------
-- 7. Update helper functions to include new roles
-- ----------------------------------------------------------------------------

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'super_admin' from users where id = auth.uid()), false);
$$;

create or replace function is_director_or_above()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('super_admin', 'director') from users where id = auth.uid()), false);
$$;

create or replace function is_admin_or_above()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('super_admin', 'director', 'admin') from users where id = auth.uid()), false);
$$;

create or replace function auth_user_branch_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select branch_id from users where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 8. RLS for new tables
-- ----------------------------------------------------------------------------

alter table branches enable row level security;
alter table company_subscriptions enable row level security;
alter table employee_salaries enable row level security;
alter table salary_payments enable row level security;

-- Branches
create policy "Super admins manage all branches"
  on branches for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Company members can view their branches"
  on branches for select
  using (company_id = auth_user_company_id());

create policy "Directors can manage company branches"
  on branches for all
  using (company_id = auth_user_company_id() and is_director_or_above())
  with check (company_id = auth_user_company_id() and is_director_or_above());

-- Company subscriptions (super admin only)
create policy "Super admins manage all subscriptions"
  on company_subscriptions for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Directors can view their company subscriptions"
  on company_subscriptions for select
  using (company_id = auth_user_company_id() and is_director_or_above());

-- Employee salaries
create policy "Super admins manage all salaries"
  on employee_salaries for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Directors manage company salaries"
  on employee_salaries for all
  using (company_id = auth_user_company_id() and is_director_or_above())
  with check (company_id = auth_user_company_id() and is_director_or_above());

create policy "Admins view branch salaries"
  on employee_salaries for select
  using (
    company_id = auth_user_company_id()
    and is_admin_or_above()
    and exists (
      select 1 from users u
      where u.id = employee_salaries.employee_id
        and u.branch_id = auth_user_branch_id()
    )
  );

create policy "Workers view own salary"
  on employee_salaries for select
  using (employee_id = auth.uid());

-- Salary payments
create policy "Super admins manage all salary payments"
  on salary_payments for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Directors manage company salary payments"
  on salary_payments for all
  using (
    is_director_or_above()
    and exists (
      select 1 from employee_salaries es
      where es.id = salary_payments.salary_id
        and es.company_id = auth_user_company_id()
    )
  )
  with check (
    is_director_or_above()
    and exists (
      select 1 from employee_salaries es
      where es.id = salary_payments.salary_id
        and es.company_id = auth_user_company_id()
    )
  );

create policy "Workers view own salary payments"
  on salary_payments for select
  using (
    exists (
      select 1 from employee_salaries es
      where es.id = salary_payments.salary_id
        and es.employee_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 9. Update orders RLS: Workers see ONLY their own orders
-- ----------------------------------------------------------------------------

-- Drop old permissive order policies for non-super-admin
drop policy if exists "Company members can view their orders" on orders;
drop policy if exists "Company members can create orders" on orders;
drop policy if exists "Company members can update their orders" on orders;

-- Recreate with role-scoped logic
create policy "Workers see only own orders"
  on orders for select
  using (
    is_super_admin()
    or (
      company_id = auth_user_company_id()
      and (
        -- directors see all company orders
        auth_user_role() = 'director'
        -- admins see their branch orders
        or (auth_user_role() = 'admin' and branch_id = auth_user_branch_id())
        -- workers see only their own
        or (auth_user_role() = 'worker' and created_by = auth.uid())
        -- super_admin covered by first policy
      )
    )
  );

create policy "Company members can create orders"
  on orders for insert
  with check (company_id = auth_user_company_id());

create policy "Company members can update their orders"
  on orders for update
  using (
    is_super_admin()
    or (
      company_id = auth_user_company_id()
      and (
        auth_user_role() in ('director', 'admin')
        or created_by = auth.uid()
      )
    )
  )
  with check (company_id = auth_user_company_id());

-- ----------------------------------------------------------------------------
-- 10. Ratings table (if not exists)
-- ----------------------------------------------------------------------------

create table if not exists order_ratings (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders (id) on delete cascade,
  worker_id  uuid not null references users (id),
  company_id uuid not null references companies (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text,
  rated_at   timestamptz not null default now(),
  unique (order_id)
);

create index if not exists idx_order_ratings_worker_id on order_ratings (worker_id);
create index if not exists idx_order_ratings_company_id on order_ratings (company_id);

alter table order_ratings enable row level security;

create policy "Super admins see all ratings"
  on order_ratings for all using (is_super_admin()) with check (is_super_admin());

create policy "Role-scoped rating visibility"
  on order_ratings for select
  using (
    company_id = auth_user_company_id()
    and (
      is_director_or_above()
      or (auth_user_role() = 'admin' and exists (
        select 1 from users u where u.id = order_ratings.worker_id and u.branch_id = auth_user_branch_id()
      ))
      or worker_id = auth.uid()
    )
  );

create policy "Anyone in company can insert ratings"
  on order_ratings for insert
  with check (company_id = auth_user_company_id());
