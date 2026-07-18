-- ============================================================================
-- SoleCare — Initial schema
-- Multi-tenant SaaS: each company is a tenant, isolated via RLS on company_id
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------

create type user_role as enum ('super_admin', 'admin', 'worker');

create type order_status as enum (
  'qabul_qilindi',
  'diagnostika',
  'tozalanmoqda',
  'ta''mirlanmoqda',
  'tayyor',
  'topshirildi',
  'bekor_qilindi'
);

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------

create table companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  created_at  timestamptz not null default now()
);

comment on table companies is 'Tenants of the SaaS platform — each shoe-care business.';

-- ----------------------------------------------------------------------------
-- USERS (extends auth.users)
-- ----------------------------------------------------------------------------

create table users (
  id          uuid primary key references auth.users (id) on delete cascade,
  company_id  uuid not null references companies (id) on delete cascade,
  fullname    text not null,
  phone       text not null,
  role        user_role not null default 'worker',
  created_at  timestamptz not null default now()
);

comment on table users is 'Profile + role for each authenticated user, scoped to a company.';

create index idx_users_company_id on users (company_id);

-- ----------------------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------------------

create table orders (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies (id) on delete cascade,
  order_number    text not null,
  customer_name   text not null,
  customer_phone  text not null,
  telegram_id     text,
  shoe_type       text not null,
  brand           text,
  color           text,
  service_type    text not null,
  price           numeric(12, 2) not null default 0,
  status          order_status not null default 'qabul_qilindi',
  notes           text,
  created_by      uuid not null references users (id),
  created_at      timestamptz not null default now(),

  constraint orders_order_number_company_unique unique (company_id, order_number)
);

comment on table orders is 'Shoe-care service orders. order_number format: SH-YYYYMMDD-XXXX, unique per company per day.';

create index idx_orders_company_id on orders (company_id);
create index idx_orders_status on orders (company_id, status);
create index idx_orders_created_at on orders (company_id, created_at desc);
create index idx_orders_customer_phone on orders (company_id, customer_phone);
create index idx_orders_telegram_id on orders (telegram_id);
create index idx_orders_order_number on orders (order_number);

-- ----------------------------------------------------------------------------
-- ORDER IMAGES
-- ----------------------------------------------------------------------------

create table order_images (
  id        uuid primary key default gen_random_uuid(),
  order_id  uuid not null references orders (id) on delete cascade,
  image_url text not null
);

create index idx_order_images_order_id on order_images (order_id);

-- ----------------------------------------------------------------------------
-- STATUS HISTORY
-- ----------------------------------------------------------------------------

create table status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders (id) on delete cascade,
  old_status  order_status,
  new_status  order_status not null,
  changed_by  uuid not null references users (id),
  created_at  timestamptz not null default now()
);

create index idx_status_history_order_id on status_history (order_id);

-- ----------------------------------------------------------------------------
-- ORDER NUMBER GENERATION: SH-YYYYMMDD-XXXX (sequential per company per day)
-- ----------------------------------------------------------------------------

create table order_number_sequences (
  company_id  uuid not null references companies (id) on delete cascade,
  day_key     text not null, -- YYYYMMDD
  last_value  integer not null default 0,
  primary key (company_id, day_key)
);

create or replace function generate_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day_key text;
  v_next    integer;
begin
  if new.order_number is not null and new.order_number <> '' then
    return new;
  end if;

  v_day_key := to_char(now(), 'YYYYMMDD');

  insert into order_number_sequences (company_id, day_key, last_value)
  values (new.company_id, v_day_key, 1)
  on conflict (company_id, day_key)
  do update set last_value = order_number_sequences.last_value + 1
  returning last_value into v_next;

  new.order_number := 'SH-' || v_day_key || '-' || lpad(v_next::text, 4, '0');

  return new;
end;
$$;

create trigger trg_generate_order_number
  before insert on orders
  for each row
  execute function generate_order_number();

-- ----------------------------------------------------------------------------
-- STATUS HISTORY AUTO-LOG (audit trail on status change)
-- ----------------------------------------------------------------------------

create or replace function log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into status_history (order_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, new.created_by);
  elsif (tg_op = 'UPDATE' and old.status is distinct from new.status) then
    insert into status_history (order_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, coalesce(current_setting('app.current_user_id', true)::uuid, new.created_by));
  end if;
  return new;
end;
$$;

create trigger trg_log_order_status_change
  after insert or update on orders
  for each row
  execute function log_order_status_change();

-- ----------------------------------------------------------------------------
-- updated helper: current user's company + role (used heavily in RLS)
-- ----------------------------------------------------------------------------

create or replace function auth_user_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from users where id = auth.uid();
$$;

create or replace function auth_user_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

create or replace function is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'super_admin' from users where id = auth.uid()), false);
$$;

create or replace function is_admin_or_above()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'super_admin') from users where id = auth.uid()), false);
$$;
