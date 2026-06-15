import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Alohida Supabase client - faqat yangi xodim (auth) hisobini yaratish uchun.
 *
 * Muammo: supabase.auth.signUp() chaqirilganda, agar shu client joriy
 * sessiyani ham boshqarsa, u joriy foydalanuvchi sessiyasini yangi
 * yaratilgan xodimning sessiyasiga almashtirib qo'yadi (chunki signUp
 * avtomatik signIn qiladi). Bu admin/super_admin ekranida juda yomon UX
 * yaratardi - admin o'zining sessiyasidan "chiqib", yangi xodim sifatida
 * kirib qolardi.
 *
 * Yechim: shu alohida client hech qachon localStorage'ga sessiya
 * yozmaydi (persistSession: false) va asosiy `supabase` clientdan butunlay
 * mustaqil. signUp() shu clientda chaqirilganda, faqat shu clientning
 * "xayoliy" sessiyasi o'zgaradi, asosiy client va joriy foydalanuvchi
 * sessiyasi tegilmaydi.
 */
export const staffCreationClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
