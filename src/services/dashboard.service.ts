import { supabase } from '@/lib/supabase'
import type { DailyOrdersPoint, DashboardStats, MonthlyRevenuePoint, ServiceBreakdownPoint } from '@/types'

export async function fetchDashboardStats(companyId: string): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('v_dashboard_stats')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return {
      todayOrders: 0,
      inProgressOrders: 0,
      readyOrders: 0,
      monthlyRevenue: 0,
      totalCustomers: 0,
    }
  }

  return {
    todayOrders: data.today_orders ?? 0,
    inProgressOrders: data.in_progress_orders ?? 0,
    readyOrders: data.ready_orders ?? 0,
    monthlyRevenue: Number(data.monthly_revenue ?? 0),
    totalCustomers: data.total_customers ?? 0,
  }
}

export async function fetchDailyOrders(companyId: string, days = 14): Promise<DailyOrdersPoint[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('v_daily_orders')
    .select('day, order_count')
    .eq('company_id', companyId)
    .gte('day', since.toISOString().slice(0, 10))
    .order('day', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    date: row.day as string,
    count: row.order_count as number,
  }))
}

export async function fetchMonthlyRevenue(companyId: string, months = 6): Promise<MonthlyRevenuePoint[]> {
  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const { data, error } = await supabase
    .from('v_monthly_revenue')
    .select('month, revenue')
    .eq('company_id', companyId)
    .gte('month', since.toISOString().slice(0, 10))
    .order('month', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    month: row.month as string,
    revenue: Number(row.revenue ?? 0),
  }))
}

export async function fetchServiceBreakdown(companyId: string): Promise<ServiceBreakdownPoint[]> {
  const { data, error } = await supabase
    .from('v_service_breakdown')
    .select('service_type, order_count')
    .eq('company_id', companyId)
    .order('order_count', { ascending: false })
    .limit(6)

  if (error) throw error

  return (data ?? []).map((row) => ({
    service_type: row.service_type as string,
    count: row.order_count as number,
  }))
}

export interface StatusDistributionPoint {
  status: string
  count: number
}

export async function fetchStatusDistribution(companyId: string): Promise<StatusDistributionPoint[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('company_id', companyId)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([status, count]) => ({ status, count }))
}
