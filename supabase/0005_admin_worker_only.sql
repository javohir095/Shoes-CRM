-- =========================================================
-- 0005: Admin faqat 'worker' yarata oladi (admin yarata olmaydi)
-- ---------------------------------------------------------
-- Oldingi policy admin'ga 'worker' va 'admin' yaratishga
-- ruxsat berardi. Endi admin faqat 'worker' yarata oladi;
-- yangi admin yoki super_admin yaratish faqat super_admin
-- huquqi.
-- =========================================================

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
  for insert with check (
    public.is_super_admin()
    or (public.current_user_role() = 'admin'
        and company_id = public.current_user_company()
        and role = 'worker')
  );

-- Shu kabi, admin boshqa adminni o'chira/yangilay olmasin (faqat workerlarni)
drop policy if exists users_update on public.users;
create policy users_update on public.users
  for update using (
    public.is_super_admin()
    or id = auth.uid()
    or (public.current_user_role() = 'admin'
        and company_id = public.current_user_company()
        and role = 'worker')
  );

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
  for delete using (
    public.is_super_admin()
    or (public.current_user_role() = 'admin'
        and company_id = public.current_user_company()
        and role = 'worker')
  );
