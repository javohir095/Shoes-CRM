import { supabase } from '@/lib/supabase'
import { loginToEmailCandidates } from '@/lib/login-email'

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Username (login) bilan kirish.
 * 1. Avval Supabase RPC orqali login → email tarjimasini sinab ko'radi.
 * 2. RPC ishlamasa (migration hali bajarilmagan bo'lsa), pseudo-email
 *    variantlarini sinab ko'radi.
 */
export async function signInWithLogin(login: string, password: string) {
  const trimmed = login.trim()

  // 1. RPC orqali aniq email olish (migration 0006 kerak)
  try {
    const { data: resolvedEmail } = await supabase.rpc('resolve_login_email', { p_login: trimmed })
    if (resolvedEmail) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password })
      if (error) throw new Error(error.message)
      return data
    }
  } catch {
    // RPC yo'q bo'lsa, fallback ga o'tish
  }

  // 2. Fallback: pseudo-email kandidatlarini sinab ko'rish
  const candidates = loginToEmailCandidates(trimmed)
  let lastError: Error | null = null
  for (const email of candidates) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return data
    lastError = new Error(error.message)
  }
  throw lastError ?? new Error("Login yoki parol noto'g'ri")
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUserProfile() {
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*, companies(name)')
    .eq('id', authData.user.id)
    .single()

  if (error) throw error
  return data
}
