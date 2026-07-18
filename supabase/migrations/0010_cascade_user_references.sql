-- ============================================================================
-- 0010: Fix company/worker deletion 409 Conflict.
--
-- Deleting a company cascades to delete its `users` rows (company_id ON
-- DELETE CASCADE), but orders.created_by, status_history.changed_by,
-- order_ratings.worker_id, employee_salaries.created_by and
-- salary_payments.created_by referenced users(id) with the Postgres default
-- (NO ACTION, checked immediately per-row) — so the moment a user row was
-- deleted mid-cascade, Postgres raised a FK violation (23503), which
-- PostgREST surfaces as 409 Conflict, even though the referencing rows were
-- about to be deleted too (via company_id's own CASCADE). Same failure hits
-- "delete worker" for any worker who has ever created an order.
--
-- The Companies page already warns "Barcha ma'lumotlar o'chib ketadi" (all
-- data will be deleted) before a company delete, so cascading here matches
-- the app's own stated behavior.
-- ============================================================================

alter table orders
  drop constraint orders_created_by_fkey,
  add constraint orders_created_by_fkey
    foreign key (created_by) references users(id) on delete cascade;

alter table status_history
  drop constraint status_history_changed_by_fkey,
  add constraint status_history_changed_by_fkey
    foreign key (changed_by) references users(id) on delete cascade;

alter table order_ratings
  drop constraint order_ratings_worker_id_fkey,
  add constraint order_ratings_worker_id_fkey
    foreign key (worker_id) references users(id) on delete cascade;

alter table employee_salaries
  drop constraint employee_salaries_created_by_fkey,
  add constraint employee_salaries_created_by_fkey
    foreign key (created_by) references users(id) on delete set null;

alter table salary_payments
  drop constraint salary_payments_created_by_fkey,
  add constraint salary_payments_created_by_fkey
    foreign key (created_by) references users(id) on delete set null;

alter table company_subscriptions
  drop constraint company_subscriptions_created_by_fkey,
  add constraint company_subscriptions_created_by_fkey
    foreign key (created_by) references users(id) on delete set null;
