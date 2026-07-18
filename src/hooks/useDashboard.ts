import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchDailyOrders,
  fetchDashboardStats,
  fetchMonthlyRevenue,
  fetchServiceBreakdown,
  fetchStatusDistribution,
} from '@/services/dashboard.service'

export function useDashboardStats() {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: () => fetchDashboardStats(companyId!),
    enabled: !!companyId,
  })
}

export function useDailyOrders(days = 14) {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['daily-orders', companyId, days],
    queryFn: () => fetchDailyOrders(companyId!, days),
    enabled: !!companyId,
  })
}

export function useMonthlyRevenue(months = 6) {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['monthly-revenue', companyId, months],
    queryFn: () => fetchMonthlyRevenue(companyId!, months),
    enabled: !!companyId,
  })
}

export function useServiceBreakdown() {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['service-breakdown', companyId],
    queryFn: () => fetchServiceBreakdown(companyId!),
    enabled: !!companyId,
  })
}

export function useStatusDistribution() {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['status-distribution', companyId],
    queryFn: () => fetchStatusDistribution(companyId!),
    enabled: !!companyId,
  })
}
