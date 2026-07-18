import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  confirmSalaryPayment, createSalaryPayment, fetchOwnSalaryPayments, fetchSalaries,
  fetchSalaryPayments, upsertSalary,
} from '@/services/salaries.service'

export function useSalaries(periodMonth?: string) {
  const { companyId } = useAuth()
  return useQuery({
    queryKey: ['salaries', companyId, periodMonth],
    queryFn: () => fetchSalaries(companyId!, periodMonth),
    enabled: !!companyId,
  })
}

export function useSalaryPayments(salaryId: string | undefined) {
  return useQuery({
    queryKey: ['salary-payments', salaryId],
    queryFn: () => fetchSalaryPayments(salaryId!),
    enabled: !!salaryId,
  })
}

export function useUpsertSalary() {
  const { companyId, session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { employee_id: string; salary_amount: number; period_month: string }) =>
      upsertSalary({ ...input, company_id: companyId!, created_by: session!.userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      toast.success('Maosh belgilandi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useOwnSalaries() {
  const { companyId, session } = useAuth()
  return useQuery({
    queryKey: ['salaries', 'own', companyId, session?.userId],
    // RLS restricts the result to the worker's own employee_salaries rows.
    queryFn: () => fetchSalaries(companyId!),
    enabled: !!companyId,
  })
}

export function useOwnSalaryPayments() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['salary-payments', 'own', session?.userId],
    queryFn: () => fetchOwnSalaryPayments(session!.userId),
    enabled: !!session,
  })
}

export function useConfirmSalaryPayment() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: string) => confirmSalaryPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-payments', 'own', session?.userId] })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      toast.success("To'lov tasdiqlandi")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useCreateSalaryPayment(salaryId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { amount: number; note?: string }) =>
      createSalaryPayment({ ...input, salary_id: salaryId, created_by: session!.userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-payments', salaryId] })
      queryClient.invalidateQueries({ queryKey: ['salaries'] })
      toast.success("To'lov amalga oshirildi")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}
