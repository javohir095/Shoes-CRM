import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types/database'
import { fetchCompany, updateCompany, updatePassword, updateProfile } from '@/services/settings.service'

export function useCompany() {
  const { session } = useAuth()
  const companyId = session?.company_id

  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => fetchCompany(companyId!),
    enabled: !!companyId,
  })
}

export function useUpdateCompany() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: Parameters<typeof updateCompany>[1]) => updateCompany(session!.company_id as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] })
      toast.success('Kompaniya ma\'lumotlari yangilandi')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Yangilashda xatolik')
    },
  })
}

export function useUpdateProfile() {
  const { session } = useAuth()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (values: Partial<Pick<User, 'fullname' | 'phone'>>) => updateProfile(session!.userId, values),
    onSuccess: (updated) => {
      if (session) {
        setSession({ ...session, fullname: updated.fullname })
      }
      toast.success('Profil yangilandi')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Yangilashda xatolik')
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => updatePassword(newPassword),
    onSuccess: () => {
      toast.success("Parol o'zgartirildi")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Parolni o'zgartirishda xatolik")
    },
  })
}
