-- ============================================================================
-- 0011: Enable Realtime on orders.
--
-- bot/src/notifyWorker.ts subscribes to postgres_changes UPDATE events on
-- orders (status -> tayyor / topshirildi) to push Telegram notifications.
-- That subscription silently receives nothing unless the table is added to
-- the supabase_realtime publication — this was never done, so no "ready to
-- pick up" or rating-request messages were ever sent despite the bot code
-- and Render worker both being correct and running.
-- ============================================================================

alter publication supabase_realtime add table orders;
