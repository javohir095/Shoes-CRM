import { supabase } from '@/lib/supabase'

export interface CustomerSummary {
  customer_phone: string
  customer_name: string
  telegram_id: string | null
  order_count: number
  total_spent: number
  last_order_at: string
}

export async function fetchCustomers(companyId: string, search?: string): Promise<CustomerSummary[]> {
  let query = supabase
    .from('orders')
    .select('customer_name, customer_phone, telegram_id, price, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (search) {
    const term = search.trim()
    query = query.or(`customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, CustomerSummary>()

  for (const row of data ?? []) {
    const existing = map.get(row.customer_phone)
    if (existing) {
      existing.order_count += 1
      existing.total_spent += row.price
      if (row.created_at > existing.last_order_at) {
        existing.last_order_at = row.created_at
        existing.customer_name = row.customer_name
      }
    } else {
      map.set(row.customer_phone, {
        customer_phone: row.customer_phone,
        customer_name: row.customer_name,
        telegram_id: row.telegram_id,
        order_count: 1,
        total_spent: row.price,
        last_order_at: row.created_at,
      })
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_order_at).getTime() - new Date(a.last_order_at).getTime()
  )
}
