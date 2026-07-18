import { supabase } from './supabase.js'
import type { Company, Order } from './types.js'

export async function getAllCompaniesWithBots(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, bot_token, bot_username')
    .not('bot_token', 'is', null)
  if (error) throw error
  return (data ?? []) as Company[]
}

export async function updateCompanyBotUsername(companyId: string, username: string): Promise<void> {
  await supabase.from('companies').update({ bot_username: username }).eq('id', companyId)
}

// order_number is only unique per company (UNIQUE(company_id, order_number)),
// not globally — two companies can both have e.g. "SH-20260718-0001" as
// their first order of the day. Each bot instance belongs to exactly one
// company, so lookups must be scoped to it or a cross-company collision
// makes maybeSingle() see >1 row and silently report "not found".
export async function findOrderByNumber(orderNumber: string, companyId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('company_id', companyId)
    .ilike('order_number', orderNumber.trim())
    .maybeSingle()
  if (error) return null
  return data as Order | null
}

export async function findOrdersByTelegramId(telegramId: string, companyId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) return []
  return (data ?? []) as Order[]
}

export async function linkTelegramToOrder(orderId: string, telegramId: string): Promise<void> {
  await supabase.from('orders').update({ telegram_id: telegramId }).eq('id', orderId)
}

export async function findOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle()
  if (error) return null
  return data as Order | null
}

/** Upsert so a customer re-tapping a star button updates their rating instead of erroring (order_id is UNIQUE). */
export async function rateOrder(
  orderId: string,
  workerId: string,
  companyId: string,
  rating: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('order_ratings')
    .upsert(
      { order_id: orderId, worker_id: workerId, company_id: companyId, rating },
      { onConflict: 'order_id' }
    )
  return { error: error?.message ?? null }
}

export async function getPendingNotifications(): Promise<Order[]> {
  // Get orders that just became 'tayyor' and have telegram_id
  // We use a simple approach: check orders with tayyor status and telegram_id
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'tayyor')
    .not('telegram_id', 'is', null)
  if (error) return []
  return (data ?? []) as Order[]
}
