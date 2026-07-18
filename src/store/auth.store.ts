import { create } from 'zustand'
import type { AuthSession } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: AuthSession | null
  loading: boolean
  initialized: boolean
  setSession: (session: AuthSession | null) => void
  init: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  loading: true,
  initialized: false,

  setSession: (session) => set({ session }),

  init: async () => {
    if (get().initialized) return
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      if (data.session?.user) {
        await hydrateProfile(data.session.user.id, data.session.user.email ?? '', set)
      } else {
        set({ session: null })
      }
    } catch (err) {
      console.error('[Auth] Init error:', err)
      set({ session: null })
    } finally {
      // ALWAYS mark as initialized so ProtectedRoute doesn't spin forever
      set({ loading: false, initialized: true })
    }

    // Listen for future auth changes (login / logout)
    supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (event === 'SIGNED_OUT' || !authSession) {
        set({ session: null, loading: false, initialized: true })
        return
      }
      if (authSession?.user) {
        await hydrateProfile(authSession.user.id, authSession.user.email ?? '', set)
      }
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null })
  },
}))

async function hydrateProfile(
  userId: string,
  email: string,
  set: (partial: Partial<AuthState>) => void
) {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, company_id, branch_id, fullname, role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.warn('[Auth] Profile not found for user:', userId)
      set({ session: null, loading: false, initialized: true })
      return
    }

    set({
      session: {
        userId: profile.id,
        email,
        company_id: profile.company_id ?? null,
        branch_id: (profile as { branch_id?: string | null }).branch_id ?? null,
        role: profile.role,
        fullname: profile.fullname,
      },
      loading: false,
      initialized: true,
    })
  } catch (err) {
    console.error('[Auth] hydrateProfile error:', err)
    set({ session: null, loading: false, initialized: true })
  }
}
