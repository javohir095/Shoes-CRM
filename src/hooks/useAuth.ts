import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const session = useAuthStore((s) => s.session)
  const loading = useAuthStore((s) => s.loading)
  const signOut = useAuthStore((s) => s.signOut)

  return {
    session,
    loading,
    signOut,
    isAuthenticated: !!session,
    role: session?.role ?? null,
    isSuperAdmin: session?.role === 'super_admin',
    isDirector: session?.role === 'director' || session?.role === 'super_admin',
    isAdmin: session?.role === 'admin' || session?.role === 'director' || session?.role === 'super_admin',
    isWorker: session?.role === 'worker',
    companyId: session?.company_id ?? null,
    branchId: session?.branch_id ?? null,
  }
}
