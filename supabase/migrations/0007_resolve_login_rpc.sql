-- =========================================================
-- 0006: resolve_login → auth email RPC
-- ---------------------------------------------------------
-- Login sahifasida username → email tarjimasi uchun.
-- SECURITY DEFINER: auth.users jadvaliga kirish imkoni beradi.
-- =========================================================

create or replace function public.resolve_login_email(p_login text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email   text;
begin
  -- login ustuni bo'yicha qidirish (case-insensitive)
  select id into v_user_id
  from public.users
  where lower(login) = lower(trim(p_login))
  limit 1;

  if v_user_id is null then
    return null;
  end if;

  -- auth.users dan email olish
  select email into v_email
  from auth.users
  where id = v_user_id;

  return v_email;
end;
$$;

-- Anonim foydalanuvchilar ham chaqira olsin (login sahifasi autentifikatsiyasiz ishlaydi)
grant execute on function public.resolve_login_email(text) to anon, authenticated;
