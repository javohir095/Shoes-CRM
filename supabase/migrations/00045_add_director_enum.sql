-- ============================================================================
-- Adds the 'director' value to user_role in its own migration/transaction.
-- Postgres forbids using a newly added enum value in the same transaction
-- that added it, so this must commit before 0004_roles_branches_... runs.
-- ============================================================================

alter type user_role add value if not exists 'director';
