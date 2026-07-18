import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { fetchCustomers } from '@/services/customers.service'

export function useCustomers(search?: string) {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['customers', companyId, search],
    queryFn: () => fetchCustomers(companyId!, search),
    enabled: !!companyId,
  })
}
