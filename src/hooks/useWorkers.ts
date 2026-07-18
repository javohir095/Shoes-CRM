import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import type { User, UserRole } from '@/types/database'
import {
  deleteWorker,
  fetchAllUsers,
  fetchCompanyUsers,
  fetchWorkers,
  updateWorker,
  type FetchAllUsersOptions,
} from '@/services/users.service'

export function useWorkers() {
  const { companyId } = useAuth()
  return useQuery({
    queryKey: ['workers', companyId],
    queryFn: () => fetchWorkers(companyId as string),
    enabled: !!companyId,
  })
}

export function useCompanyUsers() {
  const { companyId } = useAuth()
  return useQuery({
    queryKey: ['company-users', companyId],
    queryFn: () => fetchCompanyUsers(companyId as string),
    enabled: !!companyId,
  })
}

export function useAllUsers(options: Omit<FetchAllUsersOptions, 'companyId'> = {}) {
  const { isSuperAdmin, companyId } = useAuth()
  return useQuery({
    queryKey: ['all-users', options],
    queryFn: () => fetchAllUsers({
      ...options,
      companyId: isSuperAdmin ? undefined : (companyId ?? undefined),
    }),
  })
}

export function useUpdateWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, values }: { userId: string; values: Partial<Pick<User, 'fullname' | 'phone' | 'role' | 'branch_id'>> }) =>
      updateWorker(userId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      toast.success('Xodim yangilandi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Yangilashda xatolik'),
  })
}

export function useDeleteWorker() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => deleteWorker(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['company-users'] })
      queryClient.invalidateQueries({ queryKey: ['all-users'] })
      toast.success("Xodim o'chirildi")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "O'chirishda xatolik"),
  })
}

export type { UserRole }
