import { supabase } from '@/lib/supabase'
import type { CompanySubscription, SubscriptionStatus } from '@/types/database'

export async function fetchSubscriptions(filters?: {
  companyId?: string
  status?: SubscriptionStatus
}): Promise<CompanySubscription[]> {
  let query = supabase
    .from('company_subscriptions')
    .select('*, company:companies(name, phone)')
    .order('period_end', { ascending: false })

  if (filters?.companyId) query = query.eq('company_id', filters.companyId)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as CompanySubscription[]
}

export async function createSubscription(input: {
  company_id: string
  period_start: string
  period_end: string
  amount: number
  notes?: string
  created_by: string
}): Promise<CompanySubscription> {
  const { data, error } = await supabase.from('company_subscriptions').insert(input).select().single()
  if (error) throw error
  return data as CompanySubscription
}

export async function markSubscriptionPaid(id: string): Promise<CompanySubscription> {
  const { data, error } = await supabase
    .from('company_subscriptions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CompanySubscription
}

export async function updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<void> {
  const { error } = await supabase
    .from('company_subscriptions')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}
