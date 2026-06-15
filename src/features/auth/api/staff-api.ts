import { supabase } from "@/shared/lib/supabase";
import { loginToEmail } from "@/features/auth/lib/login-email";
import type { UserRole } from "@/types/database.types";

export { loginToEmail };

export interface CreateStaffInput {
  login: string;
  password: string;
  full_name: string;
  phone?: string | null;
  role: UserRole; // 'admin' | 'worker' | 'super_admin'
  percentage?: number;
  company_id: string | null; // null faqat super_admin uchun
}

/**
 * Yangi xodim (auth + profil) yaratadi - "create-staff" Edge Function orqali.
 *
 * Edge Function service_role kalitidan foydalanib admin.createUser() chaqiradi,
 * bu email yubormaydi (signUp()'dan farqli) va Supabase email rate-limitiga
 * tushmaydi. Funksiya chaqiruvchining (admin/super_admin) sessiyasini
 * (Authorization header orqali) tekshirib, ruxsatlarni o'zi nazorat qiladi.
 */
export async function createStaffAccount(input: CreateStaffInput) {
  const normalizedLogin = input.login.trim().toLowerCase();
  if (!/^[a-z0-9_.]{3,32}$/.test(normalizedLogin)) {
    throw new Error("Login 3-32 belgi, faqat lotin harflari, raqamlar, '.' va '_' bo'lishi mumkin");
  }
  if (input.password.length < 6) {
    throw new Error("Parol kamida 6 belgidan iborat bo'lishi kerak");
  }

  const { data, error } = await supabase.functions.invoke("create-staff", {
    body: {
      login: normalizedLogin,
      password: input.password,
      full_name: input.full_name,
      phone: input.phone ?? null,
      role: input.role,
      percentage: input.percentage,
      company_id: input.company_id,
    },
  });

  if (error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const parsed = await context.clone().json();
        throw new Error(parsed.error || error.message);
      } catch {
        throw new Error(error.message);
      }
    }
    throw new Error(error.message);
  }

  if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
    const err = (data as Record<string, unknown>).error;
    if (err) throw new Error(String(err));
  }

  return data as { id: string; login: string; email: string };
}
