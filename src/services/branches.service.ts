import { supabase } from '@/lib/supabase'
import type { Branch } from '@/types/database'

export async function fetchBranches(companyId: string): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Branch[]
}

export async function fetchAllBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*, company:companies(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Branch[]
}

export interface CreateBranchInput {
  company_id: string
  name: string
  address?: string
  phone?: string
}

export async function createBranch(input: CreateBranchInput): Promise<Branch> {
  const { data, error } = await supabase.from('branches').insert(input).select().single()
  if (error) throw error
  return data as Branch
}

export async function updateBranch(id: string, values: Partial<Pick<Branch, 'name' | 'address' | 'phone' | 'is_active'>>): Promise<Branch> {
  const { data, error } = await supabase.from('branches').update(values).eq('id', id).select().single()
  if (error) throw error
  return data as Branch
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from('branches').delete().eq('id', id)
  if (error) throw error
}
