-- =========================================================
-- SEED DATA (test uchun) - ixtiyoriy
-- Bu faylni faqat development/test muhitida ishga tushiring
-- =========================================================

-- 1. Test kompaniya
insert into public.companies (id, name, legal_name, phone, address, receipt_footer_text)
values (
  '11111111-1111-1111-1111-111111111111',
  'CleanShoe Tashkent',
  'CleanShoe MCHJ',
  '+998901234567',
  'Toshkent sh., Chilonzor tumani',
  'Xaridingiz uchun rahmat! Qayta tashrif buyuring.'
)
on conflict (id) do nothing;

-- ESLATMA:
-- public.users jadvali auth.users bilan bog'langan (foreign key).
-- Shuning uchun super_admin / admin / worker foydalanuvchilarini
-- avval Supabase Auth orqali (Dashboard > Authentication > Users
-- yoki signUp() funksiyasi orqali) yaratish kerak.
--
-- Foydalanuvchi yaratilgandan keyin, uning roli va company_id'sini
-- quyidagicha yangilang:
--
-- update public.users
-- set role = 'super_admin', company_id = null
-- where id = '<AUTH_USER_UUID>';
--
-- update public.users
-- set role = 'admin', company_id = '11111111-1111-1111-1111-111111111111'
-- where id = '<AUTH_USER_UUID>';
--
-- update public.users
-- set role = 'worker',
--     company_id = '11111111-1111-1111-1111-111111111111',
--     percentage = 40
-- where id = '<AUTH_USER_UUID>';
