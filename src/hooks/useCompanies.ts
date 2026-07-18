import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createCompany, deleteCompany, fetchAllCompanies, updateCompanyAdmin,
  type CreateCompanyInput,
} from '@/services/companies.service'
import type { Company } from '@/types/database'

export function useAllCompanies() {
  return useQuery({
    queryKey: ['all-companies'],
    queryFn: fetchAllCompanies,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-companies'] })
      toast.success('Kompaniya qo\'shildi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useUpdateCompanyAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Company> }) => updateCompanyAdmin(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-companies'] })
      toast.success('Kompaniya yangilandi')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-companies'] })
      toast.success("Kompaniya o'chirildi")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Xatolik'),
  })
}
