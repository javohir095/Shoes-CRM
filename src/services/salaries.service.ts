import { supabase } from '@/lib/supabase'
import type { EmployeeSalary, SalaryPayment } from '@/types/database'

export async function fetchSalaries(companyId: string, periodMonth?: string): Promise<EmployeeSalary[]> {
  let query = supabase
    .from('employee_salaries')
    .select('*, employee:users!employee_salaries_employee_id_fkey(fullname, role, branch_id)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (periodMonth) {
    query = query.eq('period_month', periodMonth)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as EmployeeSalary[]
}

export async function fetchEmployeeSalary(employeeId: string, periodMonth: string): Promise<EmployeeSalary | null> {
  const { data, error } = await supabase
    .from('employee_salaries')
    .select('*, employee:users!employee_salaries_employee_id_fkey(fullname, role, branch_id)')
    .eq('employee_id', employeeId)
    .eq('period_month', periodMonth)
    .maybeSingle()

  if (error) throw error
  return data as unknown as EmployeeSalary | null
}

export async function upsertSalary(input: {
  employee_id: string
  company_id: string
  salary_amount: number
  period_month: string
  created_by: string
}): Promise<EmployeeSalary> {
  const { data, error } = await supabase
    .from('employee_salaries')
    .upsert(input, { onConflict: 'employee_id,period_month' })
    .select()
    .single()

  if (error) throw error
  return data as unknown as EmployeeSalary
}

export async function fetchSalaryPayments(salaryId: string): Promise<SalaryPayment[]> {
  const { data, error } = await supabase
    .from('salary_payments')
    .select('*')
    .eq('salary_id', salaryId)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SalaryPayment[]
}

export async function createSalaryPayment(input: {
  salary_id: string
  amount: number
  note?: string
  created_by: string
}): Promise<SalaryPayment> {
  const { data, error } = await supabase
    .from('salary_payments')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as SalaryPayment
}

export async function fetchOwnSalaryPayments(employeeId: string): Promise<SalaryPayment[]> {
  const { data: salaries, error: salariesError } = await supabase
    .from('employee_salaries')
    .select('id')
    .eq('employee_id', employeeId)

  if (salariesError) throw salariesError
  const salaryIds = (salaries ?? []).map((s) => s.id)
  if (salaryIds.length === 0) return []

  const { data, error } = await supabase
    .from('salary_payments')
    .select('*')
    .in('salary_id', salaryIds)
    .order('paid_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as SalaryPayment[]
}

export async function confirmSalaryPayment(paymentId: string): Promise<SalaryPayment> {
  const { data, error } = await supabase
    .from('salary_payments')
    .update({ status: 'tasdiqlangan', confirmed_at: new Date().toISOString() })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error
  return data as SalaryPayment
}
