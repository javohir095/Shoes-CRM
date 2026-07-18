import { supabase } from '@/lib/supabase'
import type { Company, User } from '@/types/database'

export async function fetchCompany(companyId: string): Promise<Company> {
  const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
  if (error) throw error
  return data as Company
}

export async function updateCompany(companyId: string, values: Partial<Pick<Company, 'name' | 'phone'>>): Promise<Company> {
  const { data, error } = await supabase.from('companies').update(values).eq('id', companyId).select().single()
  if (error) throw error
  return data as Company
}

export async function updateProfile(userId: string, values: Partial<Pick<User, 'fullname' | 'phone'>>): Promise<User> {
  const { data, error } = await supabase.from('users').update(values).eq('id', userId).select().single()
  if (error) throw error
  return data as User
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
