-- ============================================================================
-- 1-QADAM: AVVAL BU SCRIPTNI ISHGA TUSHIRING (DROP)
-- Barcha jadvallarni o'chiradi
-- ============================================================================

-- Triggerlarni o'chirish
DROP TRIGGER IF EXISTS trg_generate_order_number        ON orders CASCADE;
DROP TRIGGER IF EXISTS trg_log_order_status_change      ON orders CASCADE;
DROP TRIGGER IF EXISTS trg_update_salary_paid_amount    ON salary_payments CASCADE;

-- Funksiyalarni o'chirish
DROP FUNCTION IF EXISTS generate_order_number()         CASCADE;
DROP FUNCTION IF EXISTS log_order_status_change()       CASCADE;
DROP FUNCTION IF EXISTS update_salary_paid_amount()     CASCADE;
DROP FUNCTION IF EXISTS auth_user_company_id()          CASCADE;
DROP FUNCTION IF EXISTS auth_user_role()                CASCADE;
DROP FUNCTION IF EXISTS auth_user_branch_id()           CASCADE;
DROP FUNCTION IF EXISTS is_super_admin()                CASCADE;
DROP FUNCTION IF EXISTS is_director_or_above()          CASCADE;
DROP FUNCTION IF EXISTS is_admin_or_above()             CASCADE;

-- Viewlarni o'chirish
DROP VIEW IF EXISTS v_dashboard_stats    CASCADE;
DROP VIEW IF EXISTS v_daily_orders       CASCADE;
DROP VIEW IF EXISTS v_monthly_revenue    CASCADE;
DROP VIEW IF EXISTS v_service_breakdown  CASCADE;

-- Jadvallarni o'chirish (tartib muhim — foreign key lar sababli)
DROP TABLE IF EXISTS salary_payments        CASCADE;
DROP TABLE IF EXISTS employee_salaries      CASCADE;
DROP TABLE IF EXISTS company_subscriptions  CASCADE;
DROP TABLE IF EXISTS order_ratings          CASCADE;
DROP TABLE IF EXISTS status_history         CASCADE;
DROP TABLE IF EXISTS order_images           CASCADE;
DROP TABLE IF EXISTS order_number_sequences CASCADE;
DROP TABLE IF EXISTS orders                 CASCADE;
DROP TABLE IF EXISTS users                  CASCADE;
DROP TABLE IF EXISTS branches               CASCADE;
DROP TABLE IF EXISTS companies              CASCADE;

-- Enum typelarni o'chirish
DROP TYPE IF EXISTS user_role    CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Storage policies
DROP POLICY IF EXISTS "Public can view order images"                          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload order images"           ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete order images"           ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their company's order images" ON storage.objects;

SELECT 'Barcha jadvallar o''chirildi! Endi FULL_DATABASE_SETUP.sql ni ishga tushiring ✅' AS natija;
