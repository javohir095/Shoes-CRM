import { createClient } from '@supabase/supabase-js'

/* eslint-disable @typescript-eslint/no-explicit-any */
const env = (import.meta as any).env ?? {}

const SUPABASE_URL: string = env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY: string = env.VITE_SUPABASE_ANON_KEY ?? ''

export const isConfigured: boolean = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'undefined' &&
  SUPABASE_ANON_KEY !== 'undefined' &&
  !SUPABASE_URL.includes('XXXXXXXXXX') &&
  !SUPABASE_ANON_KEY.includes('...')
)

if (!isConfigured) {
  console.error(
    '[SoleCare] ❌ VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY topilmadi!\n' +
    '   Vercel da: Project Settings → Environment Variables ga qo\'shing.\n' +
    '   Mahalliy: .env faylni tekshiring va "npm run dev" ni qayta ishga tushiring.'
  )
}

// isConfigured=false bo'lsa ham client yaratilamiz, lekin so'rovlar xato beradi.
// Bu holda LoginPage da isConfigured tekshirib xabar ko'rsatiladi.
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
)
