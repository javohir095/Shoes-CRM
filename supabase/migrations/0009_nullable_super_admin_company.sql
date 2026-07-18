-- ============================================================================
-- 0009: Super admin must not be anchored to a deletable company.
--
-- users.company_id was NOT NULL with ON DELETE CASCADE. A super_admin's
-- profile was being attached to a placeholder company; deleting that company
-- (e.g. from the Companies page) cascade-deleted the super_admin's own
-- profile row, locking them out (auth login still worked, but the
-- public.users row vanished -> PostgREST 406 on the profile fetch).
--
-- The app already treats company_id as nullable for super_admin (see
-- AuthSession type + useAllUsers/useWorkers), so make the column match.
-- ============================================================================

alter table users alter column company_id drop not null;
