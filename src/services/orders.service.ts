import { supabase } from '@/lib/supabase'
import type { Order, OrderStatus } from '@/types/database'
import type { OrderFormValues } from '@/schemas/order.schema'
import type { OrderFilters } from '@/types'

export interface OrdersQueryResult {
  orders: Order[]
  total: number
}

export async function fetchOrders(
  companyId: string | null,
  filters: OrderFilters,
  page = 1,
  pageSize = 20
): Promise<OrdersQueryResult> {
  let query = supabase
    .from('orders')
    .select('*, order_images(*), worker:users!orders_created_by_fkey(id, fullname)', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Super admin has no company_id and sees orders across every company.
  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.workerId && filters.workerId !== 'all') {
    query = query.eq('created_by', filters.workerId)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    query = query.lte('created_at', `${filters.dateTo}T23:59:59`)
  }

  if (filters.search) {
    const term = filters.search.trim()
    query = query.or(
      `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error

  return {
    orders: (data ?? []).map((row) => ({
      ...row,
      images: (row as unknown as { order_images: Order['images'] }).order_images,
    })) as Order[],
    total: count ?? 0,
  }
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, order_images(*), worker:users!orders_created_by_fkey(id, fullname), status_history(*, changed_by_user:users!status_history_changed_by_fkey(fullname)), company:companies(bot_username)'
    )
    .eq('id', orderId)
    .single()

  if (error) throw error

  return {
    ...data,
    images: (data as unknown as { order_images: Order['images'] }).order_images,
  } as Order
}

export async function createOrder(
  companyId: string,
  userId: string,
  values: OrderFormValues
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      company_id: companyId,
      customer_name: values.customer_name,
      customer_phone: values.customer_phone,
      telegram_id: values.telegram_id || null,
      shoe_type: values.shoe_type,
      brand: values.brand || null,
      color: values.color || null,
      service_type: values.service_type,
      price: values.price,
      notes: values.notes || null,
      created_by: userId,
      status: 'qabul_qilindi',
    })
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export async function updateOrder(orderId: string, values: Partial<OrderFormValues>): Promise<Order> {
  const payload: Record<string, unknown> = {}
  if (values.customer_name !== undefined) payload.customer_name = values.customer_name
  if (values.customer_phone !== undefined) payload.customer_phone = values.customer_phone
  if (values.telegram_id !== undefined) payload.telegram_id = values.telegram_id || null
  if (values.shoe_type !== undefined) payload.shoe_type = values.shoe_type
  if (values.brand !== undefined) payload.brand = values.brand || null
  if (values.color !== undefined) payload.color = values.color || null
  if (values.service_type !== undefined) payload.service_type = values.service_type
  if (values.price !== undefined) payload.price = values.price
  if (values.notes !== undefined) payload.notes = values.notes || null

  const { data, error } = await supabase.from('orders').update(payload).eq('id', orderId).select().single()
  if (error) throw error
  return data as Order
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) throw error
  return data as Order
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw error
}

export async function uploadOrderImage(companyId: string, orderId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${companyId}/${orderId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('order-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage.from('order-images').getPublicUrl(path)

  const { error: insertError } = await supabase.from('order_images').insert({
    order_id: orderId,
    image_url: publicUrlData.publicUrl,
  })
  if (insertError) throw insertError

  return publicUrlData.publicUrl
}

export async function deleteOrderImage(imageId: string): Promise<void> {
  const { error } = await supabase.from('order_images').delete().eq('id', imageId)
  if (error) throw error
}
