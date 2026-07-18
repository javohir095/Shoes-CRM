-- =========================================================
-- 0006: Login-based authentication support
-- Adds a `login` column to public.users so users can sign in
-- with a simple username instead of an email address.
--
-- resolve_login_email() (migration 0007) maps login -> email
-- and the login page uses that email with Supabase Auth under
-- the hood. The `login` value is globally unique across the
-- whole system, so the login page can resolve it to an email
-- without knowing the company in advance.
-- =========================================================

alter table public.users
  add column if not exists login text;

-- Login is globally unique (case-insensitive)
create unique index if not exists idx_users_login_unique
  on public.users (lower(login))
  where login is not null;

comment on column public.users.login is 'Foydalanuvchi nomi (login), email o''rniga ishlatiladi. Global unique.';
