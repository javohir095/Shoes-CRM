// =========================================================
// Login -> Email mapping
// ---------------------------------------------------------
// Supabase Auth har bir foydalanuvchi uchun email talab qiladi,
// lekin foydalanuvchilarga oddiy "login" (masalan "sardor")
// ko'rsatamiz. Orqa fonda login quyidagi domenlardan biriga
// qo'shiladi.
//
// CURRENT_LOGIN_DOMAIN - yangi yaratiladigan xodimlar uchun
//   (AddStaffDialog shu domenni ishlatadi)
// LEGACY_LOGIN_DOMAINS - eski (seed.cjs orqali yaratilgan)
//   foydalanuvchilar uchun. Login sahifasi avval CURRENT
//   domeni bilan, muvaffaqiyatsiz bo'lsa LEGACY domenlar
//   bilan urinib ko'radi.
// =========================================================

export const CURRENT_LOGIN_DOMAIN = "shoecare-erp.com";
export const LEGACY_LOGIN_DOMAINS = ["shoecare.uz", "shoecare.local"];

export function loginToEmail(login: string, domain: string = CURRENT_LOGIN_DOMAIN): string {
  const trimmed = login.trim().toLowerCase();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@${domain}`;
}

/** Login uchun urinib ko'riladigan barcha email variantlari (eng yangi domen birinchi). */
export function loginToEmailCandidates(login: string): string[] {
  const trimmed = login.trim().toLowerCase();
  if (trimmed.includes("@")) return [trimmed];
  return [CURRENT_LOGIN_DOMAIN, ...LEGACY_LOGIN_DOMAINS].map((domain) => `${trimmed}@${domain}`);
}
