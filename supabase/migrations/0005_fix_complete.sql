-- ============================================================================
-- SoleCare — TO'LIQ TUZATISH MIGRATSIYASI
-- SQL Editor da bir marta ishga tushiring
-- Xavfsiz: IF NOT EXISTS va OR REPLACE ishlatiladi
-- ============================================================================

-- 1. director rolini qo'shish
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'director';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. companies jadvaliga ustunlar qo'shish
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_fee numeric(12,2) NOT NULL DEFAULT 500000;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bot_token text;

-- 3. branches jadvali
CREATE TABLE IF NOT EXISTS branches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  address     text,
  phone       text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON branches(company_id);

-- 4. branch_id ustunlarini qo'shish
ALTER TABLE users  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_branch_id  ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);

-- 5. company_subscriptions jadvali
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end   date NOT NULL,
  amount       numeric(12,2) NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  paid_at      timestamptz,
  notes        text,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id ON company_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_status     ON company_subscriptions(status);

-- 6. employee_salaries jadvali (avvalgi noto'g'ri versiyasini o'chirib qayta yaratish)
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
CREATE INDEX IF NOT EXISTS idx_employee_salaries_period      ON employee_salaries(period_month DESC);

-- 7. salary_payments jadvali
CREATE TABLE salary_payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id  uuid NOT NULL REFERENCES employee_salaries(id) ON DELETE CASCADE,
  amount     numeric(12,2) NOT NULL CHECK (amount > 0),
  note       text,
  paid_at    timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_salary_payments_salary_id ON salary_payments(salary_id);

-- 8. paid_amount ni avtomatik yangilaydigan trigger
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

-- 9. Yordamchi funksiyalarni yangilash
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

CREATE OR REPLACE FUNCTION auth_user_branch_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT branch_id FROM users WHERE id = auth.uid();
$$;

-- 10. RLS yoqish
ALTER TABLE branches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments       ENABLE ROW LEVEL SECURITY;

-- 11. RLS policies — branches
DROP POLICY IF EXISTS "Super admins manage all branches"      ON branches;
DROP POLICY IF EXISTS "Company members can view their branches" ON branches;
DROP POLICY IF EXISTS "Directors can manage company branches"  ON branches;

CREATE POLICY "Super admins manage all branches"
  ON branches FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Company members can view their branches"
  ON branches FOR SELECT USING (company_id = auth_user_company_id());

CREATE POLICY "Directors can manage company branches"
  ON branches FOR ALL
  USING (company_id = auth_user_company_id() AND is_director_or_above())
  WITH CHECK (company_id = auth_user_company_id() AND is_director_or_above());

-- 12. RLS policies — subscriptions
DROP POLICY IF EXISTS "Super admins manage all subscriptions"          ON company_subscriptions;
DROP POLICY IF EXISTS "Directors can view their company subscriptions" ON company_subscriptions;

CREATE POLICY "Super admins manage all subscriptions"
  ON company_subscriptions FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Directors can view their company subscriptions"
  ON company_subscriptions FOR SELECT
  USING (company_id = auth_user_company_id() AND is_director_or_above());

-- 13. RLS policies — employee_salaries
CREATE POLICY "Super admins manage all salaries"
  ON employee_salaries FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Directors manage company salaries"
  ON employee_salaries FOR ALL
  USING (company_id = auth_user_company_id() AND is_director_or_above())
  WITH CHECK (company_id = auth_user_company_id() AND is_director_or_above());

CREATE POLICY "Admins view branch salaries"
  ON employee_salaries FOR SELECT
  USING (
    company_id = auth_user_company_id() AND is_admin_or_above()
    AND EXISTS (SELECT 1 FROM users u WHERE u.id = employee_salaries.employee_id AND u.branch_id = auth_user_branch_id())
  );

CREATE POLICY "Workers view own salary"
  ON employee_salaries FOR SELECT USING (employee_id = auth.uid());

-- 14. RLS policies — salary_payments
CREATE POLICY "Super admins manage all salary payments"
  ON salary_payments FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Directors manage company salary payments"
  ON salary_payments FOR ALL
  USING (is_director_or_above() AND EXISTS (
    SELECT 1 FROM employee_salaries es
    WHERE es.id = salary_payments.salary_id AND es.company_id = auth_user_company_id()
  ))
  WITH CHECK (is_director_or_above() AND EXISTS (
    SELECT 1 FROM employee_salaries es
    WHERE es.id = salary_payments.salary_id AND es.company_id = auth_user_company_id()
  ));

CREATE POLICY "Workers view own salary payments"
  ON salary_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM employee_salaries es
    WHERE es.id = salary_payments.salary_id AND es.employee_id = auth.uid()
  ));

-- 15. Orders RLS ni yangilash
DROP POLICY IF EXISTS "Company members can view their orders"   ON orders;
DROP POLICY IF EXISTS "Company members can create orders"       ON orders;
DROP POLICY IF EXISTS "Company members can update their orders" ON orders;
DROP POLICY IF EXISTS "Workers see only own orders"             ON orders;

CREATE POLICY "Workers see only own orders"
  ON orders FOR SELECT
  USING (
    is_super_admin()
    OR (
      company_id = auth_user_company_id()
      AND (
        auth_user_role() = 'director'
        OR (auth_user_role() = 'admin' AND (branch_id = auth_user_branch_id() OR branch_id IS NULL))
        OR (auth_user_role() = 'worker' AND created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Company members can create orders"
  ON orders FOR INSERT WITH CHECK (company_id = auth_user_company_id());

CREATE POLICY "Company members can update their orders"
  ON orders FOR UPDATE
  USING (
    is_super_admin()
    OR (company_id = auth_user_company_id() AND (auth_user_role() IN ('director','admin') OR created_by = auth.uid()))
  )
  WITH CHECK (company_id = auth_user_company_id());

-- 16. order_ratings jadvali
CREATE TABLE IF NOT EXISTS order_ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  worker_id  uuid NOT NULL REFERENCES users(id),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    text,
  rated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);
CREATE INDEX IF NOT EXISTS idx_order_ratings_worker_id  ON order_ratings(worker_id);
CREATE INDEX IF NOT EXISTS idx_order_ratings_company_id ON order_ratings(company_id);

ALTER TABLE order_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins see all ratings"     ON order_ratings;
DROP POLICY IF EXISTS "Role-scoped rating visibility"    ON order_ratings;
DROP POLICY IF EXISTS "Anyone in company can insert ratings" ON order_ratings;

CREATE POLICY "Super admins see all ratings"
  ON order_ratings FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "Role-scoped rating visibility"
  ON order_ratings FOR SELECT
  USING (
    company_id = auth_user_company_id()
    AND (
      is_director_or_above()
      OR (auth_user_role() = 'admin' AND EXISTS (
        SELECT 1 FROM users u WHERE u.id = order_ratings.worker_id AND u.branch_id = auth_user_branch_id()
      ))
      OR worker_id = auth.uid()
    )
  );

CREATE POLICY "Anyone in company can insert ratings"
  ON order_ratings FOR INSERT WITH CHECK (company_id = auth_user_company_id());

-- ============================================================================
-- TAYYOR! Barcha jadvallar va RLS to'g'ri o'rnatildi.
-- ============================================================================
SELECT 'Migration muvaffaqiyatli bajarildi! ✅' AS result;
