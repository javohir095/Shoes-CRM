// =========================================================
// create-staff Edge Function
// ---------------------------------------------------------
// Yangi xodim (admin/worker/super_admin) hisobini yaratadi.
// admin.createUser() ishlatadi - email yubormaydi, rate-limit
// muammosi yo'q.
//
// Authorization: chaqiruvchi (admin/super_admin) JWT'si
// Authorization header orqali yuboriladi. Funksiya:
//   - chaqiruvchi profilini tekshiradi (role, company_id)
//   - admin -> faqat o'z company_id'sida 'worker' yarata oladi
//   - super_admin -> istalgan rol/kompaniyada yarata oladi
// =========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Avtorizatsiya talab qilinadi" }, 401);

    const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);
    if (callerError || !callerData?.user) {
      return json({ error: "Sessiya yaroqsiz" }, 401);
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("users")
      .select("id, role, company_id, is_active")
      .eq("id", callerData.user.id)
      .single();

    if (callerProfileError || !callerProfile) {
      return json({ error: "Profil topilmadi" }, 403);
    }
    if (!callerProfile.is_active) {
      return json({ error: "Hisobingiz bloklangan" }, 403);
    }

    const isSuperAdmin = callerProfile.role === "super_admin";
    const isAdmin = callerProfile.role === "admin";
    if (!isSuperAdmin && !isAdmin) {
      return json({ error: "Ruxsat yo'q" }, 403);
    }

    const body = await req.json();
    const { login, password, full_name, phone, role, percentage, company_id } = body;

    if (!login || !password || !full_name || !role) {
      return json({ error: "Majburiy maydonlar to'ldirilmagan" }, 400);
    }
    if (String(password).length < 6) {
      return json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }, 400);
    }

    const normalizedLogin = String(login).trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,32}$/.test(normalizedLogin)) {
      return json(
        { error: "Login 3-32 belgi, faqat lotin harflari, raqamlar, '.' va '_' bo'lishi mumkin" },
        400
      );
    }

    // Rol va kompaniya bo'yicha ruxsatlar
    let targetCompanyId: string | null;
    if (isSuperAdmin) {
      if (!["worker", "admin", "super_admin"].includes(role)) {
        return json({ error: "Noto'g'ri rol" }, 400);
      }
      targetCompanyId = role === "super_admin" ? null : (company_id ?? null);
      if (role !== "super_admin" && !targetCompanyId) {
        return json({ error: "Kompaniya tanlanmagan" }, 400);
      }
    } else {
      // admin
      if (role !== "worker") {
        return json({ error: "Faqat super admin admin/super_admin yarata oladi" }, 403);
      }
      targetCompanyId = callerProfile.company_id;
      if (!targetCompanyId) {
        return json({ error: "Kompaniya aniqlanmadi" }, 400);
      }
    }

    // Login bandligini tekshirish
    const { data: existing } = await adminClient
      .from("users")
      .select("id")
      .eq("login", normalizedLogin)
      .maybeSingle();
    if (existing) {
      return json({ error: "Bu login band, boshqasini tanlang" }, 409);
    }

    const email = `${normalizedLogin}@shoecare-erp.com`;

    let newUserId: string;

    const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createAuthError) {
      // Agar email allaqachon auth.users'da mavjud bo'lsa (masalan, oldingi
      // urinishda profil yozish bosqichida xato bo'lgan bo'lsa), mavjud
      // auth userni topib, shu UID bilan profil yaratamiz/yangilaymiz.
      const isAlreadyRegistered =
        createAuthError.message.toLowerCase().includes("already registered") ||
        createAuthError.message.toLowerCase().includes("already exists") ||
        createAuthError.code === "email_exists";

      if (!isAlreadyRegistered) {
        return json({ error: createAuthError.message }, 500);
      }

      // Mavjud auth userni email orqali topish
      let foundId: string | null = null;
      let page = 1;
      while (!foundId) {
        const { data: pageData, error: listError } = await adminClient.auth.admin.listUsers({
          page,
          perPage: 200,
        });
        if (listError) return json({ error: listError.message }, 500);
        if (!pageData || pageData.users.length === 0) break;

        const match = pageData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (match) {
          foundId = match.id;
          break;
        }
        if (pageData.users.length < 200) break;
        page += 1;
      }

      if (!foundId) {
        return json({ error: "Email band, lekin foydalanuvchi topilmadi. Boshqa login tanlang." }, 409);
      }

      // Parolni yangilash (yangi parol bilan)
      const { error: updatePwError } = await adminClient.auth.admin.updateUserById(foundId, {
        password,
        email_confirm: true,
      });
      if (updatePwError) {
        return json({ error: updatePwError.message }, 500);
      }

      newUserId = foundId;
    } else {
      newUserId = createdAuth.user.id;
    }

    // Agar shu id bilan profil allaqachon mavjud bo'lsa (eski iz), avval o'chiramiz
    await adminClient.from("users").delete().eq("id", newUserId);

    const { error: profileError } = await adminClient.from("users").insert({
      id: newUserId,
      company_id: targetCompanyId,
      full_name,
      phone: phone ?? null,
      role,
      login: normalizedLogin,
      percentage: role === "worker" ? Number(percentage ?? 0) : 0,
      is_active: true,
    });

    if (profileError) {
      return json({ error: profileError.message }, 500);
    }

    return json({ id: newUserId, login: normalizedLogin, email });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Kutilmagan xatolik" }, 500);
  }
});
