import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'

export async function fetchAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Company[]
}

export interface CreateCompanyInput {
  name: string
  phone: string
  monthly_fee: number
  bot_token?: string
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: input.name,
      phone: input.phone,
      monthly_fee: input.monthly_fee,
      bot_token: input.bot_token || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Company
}

export async function updateCompanyAdmin(id: string, values: Partial<Pick<Company, 'name' | 'phone' | 'monthly_fee' | 'bot_token'>>): Promise<Company> {
  const { data, error } = await supabase.from('companies').update(values).eq('id', id).select().single()
  if (error) throw error
  return data as Company
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}

export interface CompanyStats {
  companyId: string
  totalOrders: number
  monthlyRevenue: number
}

export async function fetchCompanyStats(): Promise<CompanyStats[]> {
  const { data, error } = await supabase
    .from('v_dashboard_stats')
    .select('company_id, monthly_revenue')
  if (error) throw error

  return (data ?? []).map((row) => ({
    companyId: row.company_id as string,
    totalOrders: 0,
    monthlyRevenue: Number(row.monthly_revenue ?? 0),
  }))
}
