import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  createBranch, deleteBranch, fetchAllBranches, fetchBranches, updateBranch,
  type CreateBranchInput,
} from '@/services/branches.service'
import type { Branch } from '@/types/database'

/** Own-company branches for director/admin/worker; all companies' branches (with company name) for super_admin. */
export function useBranches() {
  const { companyId, isSuperAdmin } = useAuth()
  return useQuery({
    queryKey: isSuperAdmin ? ['branches', 'all'] : ['branches', companyId],
    queryFn: () => (isSuperAdmin ? fetchAllBranches() : fetchBranches(companyId!)),
    enabled: isSuperAdmin || !!companyId,
  })
}

/** Branches for an arbitrary company (e.g. the company picked in a form) — used by super_admin flows. */
export function useBranchesForCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => fetchBranches(companyId!),
    enabled: !!companyId,
  })
}

export function useCreateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CreateBranchInput) => createBranch(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Filial qo\'shildi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useUpdateBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Pick<Branch, 'name' | 'address' | 'phone' | 'is_active'>> }) =>
      updateBranch(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Filial yangilandi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useDeleteBranch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      toast.success("Filial o'chirildi")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}
