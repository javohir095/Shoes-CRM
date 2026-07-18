-- ============================================================================
-- Row Level Security policies
-- Tenancy rule: a row is visible only if it belongs to the caller's company,
-- except super_admin who can see everything across companies.
-- ============================================================================

alter table companies enable row level security;
alter table users enable row level security;
alter table orders enable row level security;
alter table order_images enable row level security;
alter table status_history enable row level security;
alter table order_number_sequences enable row level security;

-- ----------------------------------------------------------------------------
-- COMPANIES
-- ----------------------------------------------------------------------------

create policy "Super admins manage all companies"
  on companies for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Members can view their own company"
  on companies for select
  using (id = auth_user_company_id());

create policy "Admins can update their own company"
  on companies for update
  using (id = auth_user_company_id() and is_admin_or_above())
  with check (id = auth_user_company_id() and is_admin_or_above());

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------

create policy "Super admins manage all users"
  on users for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Users can view colleagues in their company"
  on users for select
  using (company_id = auth_user_company_id());

create policy "Users can update their own profile"
  on users for update
  using (id = auth.uid())
  with check (id = auth.uid() and company_id = auth_user_company_id());

create policy "Admins can insert workers in their company"
  on users for insert
  with check (company_id = auth_user_company_id() and is_admin_or_above());

create policy "Admins can update workers in their company"
  on users for update
  using (company_id = auth_user_company_id() and is_admin_or_above())
  with check (company_id = auth_user_company_id() and is_admin_or_above());

create policy "Admins can delete workers in their company"
  on users for delete
  using (company_id = auth_user_company_id() and is_admin_or_above() and role <> 'admin');

-- ----------------------------------------------------------------------------
-- ORDERS
-- ----------------------------------------------------------------------------

create policy "Super admins manage all orders"
  on orders for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Company members can view their orders"
  on orders for select
  using (company_id = auth_user_company_id());

create policy "Company members can create orders"
  on orders for insert
  with check (company_id = auth_user_company_id());

create policy "Company members can update their orders"
  on orders for update
  using (company_id = auth_user_company_id())
  with check (company_id = auth_user_company_id());

create policy "Admins can delete orders in their company"
  on orders for delete
  using (company_id = auth_user_company_id() and is_admin_or_above());

-- ----------------------------------------------------------------------------
-- ORDER IMAGES (scoped via parent order's company)
-- ----------------------------------------------------------------------------

create policy "Super admins manage all order images"
  on order_images for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Company members can view order images"
  on order_images for select
  using (
    exists (
      select 1 from orders o
      where o.id = order_images.order_id
        and o.company_id = auth_user_company_id()
    )
  );

create policy "Company members can add order images"
  on order_images for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = order_images.order_id
        and o.company_id = auth_user_company_id()
    )
  );

create policy "Admins can delete order images"
  on order_images for delete
  using (
    is_admin_or_above() and exists (
      select 1 from orders o
      where o.id = order_images.order_id
        and o.company_id = auth_user_company_id()
    )
  );

-- ----------------------------------------------------------------------------
-- STATUS HISTORY (read-only audit trail, scoped via parent order)
-- ----------------------------------------------------------------------------

create policy "Super admins view all status history"
  on status_history for all
  using (is_super_admin())
  with check (is_super_admin());

create policy "Company members can view status history"
  on status_history for select
  using (
    exists (
      select 1 from orders o
      where o.id = status_history.order_id
        and o.company_id = auth_user_company_id()
    )
  );

create policy "Company members can insert status history"
  on status_history for insert
  with check (
    exists (
      select 1 from orders o
      where o.id = status_history.order_id
        and o.company_id = auth_user_company_id()
    )
  );

-- ----------------------------------------------------------------------------
-- ORDER NUMBER SEQUENCES (internal — managed only by trigger via security definer)
-- ----------------------------------------------------------------------------

create policy "No direct access to order number sequences"
  on order_number_sequences for all
  using (false)
  with check (false);
