import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  createSubscription, fetchSubscriptions, markSubscriptionPaid,
} from '@/services/subscriptions.service'
import type { SubscriptionStatus } from '@/types/database'

export function useSubscriptions(filters?: { companyId?: string; status?: SubscriptionStatus }) {
  return useQuery({
    queryKey: ['subscriptions', filters],
    queryFn: () => fetchSubscriptions(filters),
  })
}

export function useCreateSubscription() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { company_id: string; period_start: string; period_end: string; amount: number; notes?: string }) =>
      createSubscription({ ...input, created_by: session!.userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success('Obuna yaratildi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useMarkSubscriptionPaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markSubscriptionPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      toast.success("To'lov tasdiqlandi")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}
