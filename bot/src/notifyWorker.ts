/**
 * notifyWorker.ts
 *
 * Subscribes to Supabase Realtime on the orders table.
 * When an order's status changes to 'tayyor' AND the order has a telegram_id,
 * sends a Telegram notification using the company's bot token.
 */
import 'dotenv/config'
import { Telegraf } from 'telegraf'
import { supabase } from './supabase.js'
import { getReadyNotificationText } from './handlers.js'

interface OrderPayload {
  id: string
  company_id: string
  order_number: string
  telegram_id: string | null
  status: string
}

// Cache bot instances to avoid creating one per notification
const botCache = new Map<string, Telegraf>()

async function getBotForCompany(companyId: string): Promise<Telegraf | null> {
  if (botCache.has(companyId)) return botCache.get(companyId)!

  const { data, error } = await supabase
    .from('companies')
    .select('bot_token')
    .eq('id', companyId)
    .single()

  if (error || !data?.bot_token) return null

  const bot = new Telegraf(data.bot_token as string)
  botCache.set(companyId, bot)
  return bot
}

async function sendReadyNotification(order: OrderPayload): Promise<void> {
  if (!order.telegram_id) return

  const bot = await getBotForCompany(order.company_id)
  if (!bot) {
    console.warn(`[Notify] No bot token for company ${order.company_id}`)
    return
  }

  try {
    await bot.telegram.sendMessage(
      order.telegram_id,
      getReadyNotificationText(order.order_number),
      { parse_mode: 'Markdown' }
    )
    console.log(`[Notify] ✅ Sent notification to ${order.telegram_id} for order ${order.order_number}`)
  } catch (err) {
    console.error(`[Notify] ❌ Failed to send to ${order.telegram_id}:`, err)
  }
}

async function main() {
  console.log('[NotifyWorker] Starting Supabase Realtime subscription...')

  const channel = supabase
    .channel('orders-status-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.tayyor',
      },
      (payload) => {
        const order = payload.new as OrderPayload
        if (order.telegram_id) {
          void sendReadyNotification(order)
        }
      }
    )
    .subscribe((status) => {
      console.log(`[NotifyWorker] Realtime subscription status: ${status}`)
    })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[NotifyWorker] Shutting down...')
    await supabase.removeChannel(channel)
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  console.log('[NotifyWorker] Listening for tayyor status changes...')
}

main().catch((err) => {
  console.error('[NotifyWorker] Fatal error:', err)
  process.exit(1)
})
