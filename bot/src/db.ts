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

export async function findOrderByNumber(orderNumber: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .ilike('order_number', orderNumber.trim())
    .maybeSingle()
  if (error) return null
  return data as Order | null
}

export async function findOrdersByTelegramId(telegramId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_id', telegramId)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) return []
  return (data ?? []) as Order[]
}

export async function linkTelegramToOrder(orderId: string, telegramId: string): Promise<void> {
  await supabase.from('orders').update({ telegram_id: telegramId }).eq('id', orderId)
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
