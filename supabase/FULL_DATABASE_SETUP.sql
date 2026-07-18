-- ============================================================================
-- SoleCare — TO'LIQ BAZA SETUP (BITTA FAYL)
-- SQL Editor ga paste qiling va Run bosing
-- Baza butunlay yangi bo'lishi kerak (drop & recreate qilingan)
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'director', 'admin', 'worker');
EXCEPTION WHEN duplicate_object THEN
  -- already exists, add director if missing
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'director';
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'qabul_qilindi',
    'diagnostika',
    'tozalanmoqda',
    'ta''mirlanmoqda',
    'tayyor',
    'topshirildi',
    'bekor_qilindi'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- COMPANIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  phone       text NOT NULL DEFAULT '',
  monthly_fee numeric(12,2) NOT NULL DEFAULT 500000,
  bot_token   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_fee numeric(12,2) NOT NULL DEFAULT 500000;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bot_token text;

-- ============================================================================
-- BRANCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS branches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  address    text,
  phone      text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  branch_id  uuid REFERENCES branches(id) ON DELETE SET NULL,
  fullname   text NOT NULL,
  phone      text NOT NULL DEFAULT '',
  role       user_role NOT NULL DEFAULT 'worker',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE users ALTER COLUMN company_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id  ON users(branch_id);

-- ============================================================================
-- ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id      uuid REFERENCES branches(id) ON DELETE SET NULL,
  order_number   text NOT NULL,
  customer_name  text NOT NULL,
  customer_phone text NOT NULL,
  telegram_id    text,
  shoe_type      text NOT NULL,
  brand          text,
  color          text,
  service_type   text NOT NULL,
  price          numeric(12,2) NOT NULL DEFAULT 0,
  status         order_status NOT NULL DEFAULT 'qabul_qilindi',
  notes          text,
  created_by     uuid NOT NULL REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_order_number_company_unique UNIQUE(company_id, order_number)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_company_id      ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON orders(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone  ON orders(company_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_id     ON orders(telegram_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number    ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id       ON orders(branch_id);

-- ============================================================================
-- ORDER IMAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_images (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  image_url text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_images_order_id ON order_images(order_id);

-- ============================================================================
-- STATUS HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS status_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON status_history(order_id);

-- ============================================================================
-- ORDER NUMBER SEQUENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_number_sequences (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  day_key    text NOT NULL,
  last_value integer NOT NULL DEFAULT 0,
  PRIMARY KEY(company_id, day_key)
);

-- ============================================================================
-- COMPANY SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS company_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end   date NOT NULL,
  amount       numeric(12,2) NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue','cancelled')),
  paid_at      timestamptz,
  notes        text,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status     ON company_subscriptions(status);

-- ============================================================================
-- EMPLOYEE SALARIES
-- ============================================================================

DROP TABLE IF EXISTS salary_payments   CASCADE;
DROP TABLE IF EXISTS employee_salaries CASCADE;

CREATE TABLE employee_salaries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id       uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  salary_amount    numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount      numeric(12,2) NOT NULL DEFAULT 0,
  remaining_amount numeric(12,2) GENERATED ALWAYS AS (salary_amount - paid_amount) STORED,
  period_month     date NOT NULL,
  created_by       uuid REFERENCES users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee_id ON employee_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_company_id  ON employee_salaries(company_id);

-- ============================================================================
-- SALARY PAYMENTS
-- ============================================================================

CREATE TABLE salary_payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id  uuid NOT NULL REFERENCES employee_salaries(id) ON DELETE CASCADE,
  amount     numeric(12,2) NOT NULL CHECK(amount > 0),
  note       text,
  paid_at    timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_payments_salary_id ON salary_payments(salary_id);

-- ============================================================================
-- ORDER RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  worker_id  uuid NOT NULL REFERENCES users(id),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment    text,
  rated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_ratings_worker_id  ON order_ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_company_id ON order_ratings(company_id);

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-images', 'order-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_user_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_user_branch_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT branch_id FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION is_director_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT role IN ('super_admin','director') FROM users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT role IN ('super_admin','director','admin') FROM users WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_day_key text;
  v_next    integer;
BEGIN
  IF new.order_number IS NOT NULL AND new.order_number <> '' THEN
    RETURN new;
  END IF;
  v_day_key := to_char(now(), 'YYYYMMDD');
  INSERT INTO order_number_sequences(company_id, day_key, last_value)
  VALUES(new.company_id, v_day_key, 1)
  ON CONFLICT(company_id, day_key)
  DO UPDATE SET last_value = order_number_sequences.last_value + 1
  RETURNING last_value INTO v_next;
  new.order_number := 'SH-' || v_day_key || '-' || lpad(v_next::text, 4, '0');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_order_number ON orders;
CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO status_history(order_id, old_status, new_status, changed_by)
    VALUES(new.id, null, new.status, new.created_by);
  ELSIF (TG_OP = 'UPDATE' AND old.status IS DISTINCT FROM new.status) THEN
    INSERT INTO status_history(order_id, old_status, new_status, changed_by)
    VALUES(new.id, old.status, new.status,
      COALESCE(current_setting('app.current_user_id', true)::uuid, new.created_by));
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status_change ON orders;
CREATE TRIGGER trg_log_order_status_change
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

CREATE OR REPLACE FUNCTION update_salary_paid_amount()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE employee_salaries SET paid_amount = paid_amount + NEW.amount WHERE id = NEW.salary_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_salary_paid_amount ON salary_payments;
CREATE TRIGGER trg_update_salary_paid_amount
  AFTER INSERT ON salary_payments
  FOR EACH ROW EXECUTE FUNCTION update_salary_paid_amount();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  o.company_id,
  COUNT(*) FILTER (WHERE o.created_at::date = CURRENT_DATE) AS today_orders,
  COUNT(*) FILTER (WHERE o.status NOT IN ('topshirildi','bekor_qilindi','tayyor')) AS in_progress_orders,
  COUNT(*) FILTER (WHERE o.status = 'tayyor') AS ready_orders,
  COALESCE(SUM(o.price) FILTER (
    WHERE o.status <> 'bekor_qilindi'
      AND date_trunc('month', o.created_at) = date_trunc('month', CURRENT_DATE)
  ), 0) AS monthly_revenue,
  COUNT(DISTINCT o.customer_phone) AS total_customers
FROM orders o
GROUP BY o.company_id;

CREATE OR REPLACE VIEW v_daily_orders AS
SELECT company_id, created_at::date AS day, COUNT(*) AS order_count
FROM orders GROUP BY company_id, created_at::date ORDER BY day;

CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT company_id, date_trunc('month', created_at)::date AS month,
  SUM(price) FILTER (WHERE status <> 'bekor_qilindi') AS revenue
FROM orders GROUP BY company_id, date_trunc('month', created_at) ORDER BY month;

CREATE OR REPLACE VIEW v_service_breakdown AS
SELECT company_id, service_type, COUNT(*) AS order_count
FROM orders GROUP BY company_id, service_type ORDER BY order_count DESC;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_images           ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salaries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_ratings          ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate cleanly
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- COMPANIES
CREATE POLICY "super_admin_companies" ON companies FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_own_company"      ON companies FOR SELECT USING (id = auth_user_company_id());
CREATE POLICY "admin_update_company"  ON companies FOR UPDATE USING (id = auth_user_company_id() AND is_admin_or_above()) WITH CHECK (id = auth_user_company_id() AND is_admin_or_above());

-- BRANCHES
CREATE POLICY "super_admin_branches"  ON branches FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_own_branches"     ON branches FOR SELECT USING (company_id = auth_user_company_id());
CREATE POLICY "director_branches"     ON branches FOR ALL USING (company_id = auth_user_company_id() AND is_director_or_above()) WITH CHECK (company_id = auth_user_company_id() AND is_director_or_above());

-- USERS
CREATE POLICY "super_admin_users"     ON users FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_company_users"    ON users FOR SELECT USING (company_id = auth_user_company_id());
CREATE POLICY "update_own_profile"    ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admin_insert_users"    ON users FOR INSERT WITH CHECK (company_id = auth_user_company_id() AND is_admin_or_above());
CREATE POLICY "admin_update_users"    ON users FOR UPDATE USING (company_id = auth_user_company_id() AND is_admin_or_above()) WITH CHECK (company_id = auth_user_company_id() AND is_admin_or_above());
CREATE POLICY "admin_delete_users"    ON users FOR DELETE USING (company_id = auth_user_company_id() AND is_admin_or_above());

-- ORDERS
CREATE POLICY "super_admin_orders"    ON orders FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_orders_by_role"   ON orders FOR SELECT USING (
  company_id = auth_user_company_id() AND (
    is_director_or_above()
    OR (auth_user_role() = 'admin' AND (branch_id = auth_user_branch_id() OR branch_id IS NULL))
    OR (auth_user_role() = 'worker' AND created_by = auth.uid())
  )
);
CREATE POLICY "create_orders"         ON orders FOR INSERT WITH CHECK (company_id = auth_user_company_id());
CREATE POLICY "update_orders"         ON orders FOR UPDATE USING (company_id = auth_user_company_id() AND (is_admin_or_above() OR created_by = auth.uid())) WITH CHECK (company_id = auth_user_company_id());
CREATE POLICY "delete_orders"         ON orders FOR DELETE USING (company_id = auth_user_company_id() AND is_admin_or_above());

-- ORDER IMAGES
CREATE POLICY "super_admin_images"    ON order_images FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_order_images"     ON order_images FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_images.order_id AND o.company_id = auth_user_company_id()));
CREATE POLICY "insert_order_images"   ON order_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_images.order_id AND o.company_id = auth_user_company_id()));
CREATE POLICY "delete_order_images"   ON order_images FOR DELETE USING (is_admin_or_above() AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_images.order_id AND o.company_id = auth_user_company_id()));

-- STATUS HISTORY
CREATE POLICY "super_admin_history"   ON status_history FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_status_history"   ON status_history FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = status_history.order_id AND o.company_id = auth_user_company_id()));
CREATE POLICY "insert_status_history" ON status_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM orders o WHERE o.id = status_history.order_id AND o.company_id = auth_user_company_id()));

-- ORDER NUMBER SEQUENCES (trigger only)
CREATE POLICY "no_direct_sequences"   ON order_number_sequences FOR ALL USING (false) WITH CHECK (false);

-- COMPANY SUBSCRIPTIONS
CREATE POLICY "super_admin_subs"      ON company_subscriptions FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "director_view_subs"    ON company_subscriptions FOR SELECT USING (company_id = auth_user_company_id() AND is_director_or_above());

-- EMPLOYEE SALARIES
CREATE POLICY "super_admin_salaries"  ON employee_salaries FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "director_salaries"     ON employee_salaries FOR ALL USING (company_id = auth_user_company_id() AND is_director_or_above()) WITH CHECK (company_id = auth_user_company_id() AND is_director_or_above());
CREATE POLICY "worker_own_salary"     ON employee_salaries FOR SELECT USING (employee_id = auth.uid());

-- SALARY PAYMENTS
CREATE POLICY "super_admin_payments"  ON salary_payments FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "director_payments"     ON salary_payments FOR ALL
  USING (is_director_or_above() AND EXISTS (SELECT 1 FROM employee_salaries es WHERE es.id = salary_payments.salary_id AND es.company_id = auth_user_company_id()))
  WITH CHECK (is_director_or_above() AND EXISTS (SELECT 1 FROM employee_salaries es WHERE es.id = salary_payments.salary_id AND es.company_id = auth_user_company_id()));
CREATE POLICY "worker_own_payments"   ON salary_payments FOR SELECT USING (EXISTS (SELECT 1 FROM employee_salaries es WHERE es.id = salary_payments.salary_id AND es.employee_id = auth.uid()));

-- ORDER RATINGS
CREATE POLICY "super_admin_ratings"   ON order_ratings FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());
CREATE POLICY "view_ratings_by_role"  ON order_ratings FOR SELECT USING (
  company_id = auth_user_company_id() AND (
    is_director_or_above()
    OR (auth_user_role() = 'admin' AND EXISTS (SELECT 1 FROM users u WHERE u.id = order_ratings.worker_id AND u.branch_id = auth_user_branch_id()))
    OR worker_id = auth.uid()
  )
);
CREATE POLICY "insert_ratings"        ON order_ratings FOR INSERT WITH CHECK (company_id = auth_user_company_id());

-- STORAGE
DROP POLICY IF EXISTS "Public can view order images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload order images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their company's order images" ON storage.objects;

CREATE POLICY "Public can view order images" ON storage.objects FOR SELECT USING (bucket_id = 'order-images');
CREATE POLICY "Authenticated users can upload order images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'order-images' AND (storage.foldername(name))[1] = auth_user_company_id()::text);
CREATE POLICY "Authenticated users can delete order images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'order-images' AND (storage.foldername(name))[1] = auth_user_company_id()::text);

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'SoleCare baza muvaffaqiyatli o''rnatildi! ✅' AS natija;
