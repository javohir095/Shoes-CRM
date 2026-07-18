import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/database'

export interface UserWithCompany extends User {
  company?: { name: string }
  branch?: { name: string }
}

export async function fetchCompanyUsers(companyId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as User[]
}

export async function fetchWorkers(companyId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('company_id', companyId)
    .in('role', ['worker', 'admin', 'director'])
    .order('fullname', { ascending: true })
  if (error) throw error
  return (data ?? []) as User[]
}

export interface FetchAllUsersOptions {
  search?: string
  role?: UserRole | 'all'
  companyId?: string
  page?: number
  pageSize?: number
}

export interface AllUsersResult {
  users: UserWithCompany[]
  total: number
}

export async function fetchAllUsers(options: FetchAllUsersOptions = {}): Promise<AllUsersResult> {
  const { search, role, companyId, page = 1, pageSize = 20 } = options

  let query = supabase
    .from('users')
    .select('*, company:companies(name), branch:branches(name)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (companyId) query = query.eq('company_id', companyId)
  if (role && role !== 'all') query = query.eq('role', role)
  if (search) {
    query = query.or(`fullname.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw error

  return {
    users: (data ?? []) as unknown as UserWithCompany[],
    total: count ?? 0,
  }
}

export async function updateWorker(
  userId: string,
  values: Partial<Pick<User, 'fullname' | 'phone' | 'role' | 'branch_id'>>
): Promise<User> {
  const { data, error } = await supabase.from('users').update(values).eq('id', userId).select().single()
  if (error) throw error
  return data as User
}

export async function deleteWorker(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) throw error
}
