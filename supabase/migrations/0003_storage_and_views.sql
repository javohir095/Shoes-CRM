-- ============================================================================
-- Storage bucket for order images + convenience views
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('order-images', 'order-images', true)
on conflict (id) do nothing;

-- Public read for order images (bucket is public); writes scoped to authenticated
-- users belonging to the company that owns the order (enforced at app layer via
-- folder naming convention: {company_id}/{order_id}/{filename}).

create policy "Public can view order images"
  on storage.objects for select
  using (bucket_id = 'order-images');

create policy "Authenticated users can upload order images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'order-images'
    and (storage.foldername(name))[1] = auth_user_company_id()::text
  );

create policy "Authenticated users can delete their company's order images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'order-images'
    and (storage.foldername(name))[1] = auth_user_company_id()::text
  );

-- ----------------------------------------------------------------------------
-- Dashboard aggregate views
-- ----------------------------------------------------------------------------

create or replace view v_dashboard_stats as
select
  o.company_id,
  count(*) filter (where o.created_at::date = current_date) as today_orders,
  count(*) filter (where o.status not in ('topshirildi', 'bekor_qilindi', 'tayyor')) as in_progress_orders,
  count(*) filter (where o.status = 'tayyor') as ready_orders,
  coalesce(sum(o.price) filter (
    where o.status not in ('bekor_qilindi')
      and date_trunc('month', o.created_at) = date_trunc('month', current_date)
  ), 0) as monthly_revenue,
  count(distinct o.customer_phone) as total_customers
from orders o
group by o.company_id;

create or replace view v_daily_orders as
select
  company_id,
  created_at::date as day,
  count(*) as order_count
from orders
group by company_id, created_at::date
order by day;

create or replace view v_monthly_revenue as
select
  company_id,
  date_trunc('month', created_at)::date as month,
  sum(price) filter (where status <> 'bekor_qilindi') as revenue
from orders
group by company_id, date_trunc('month', created_at)
order by month;

create or replace view v_service_breakdown as
select
  company_id,
  service_type,
  count(*) as order_count
from orders
group by company_id, service_type
order by order_count desc;
