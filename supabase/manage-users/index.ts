// =========================================================
// manage-users Edge Function
// ---------------------------------------------------------
// Handles user account operations that require the
// service_role key (Supabase Auth Admin API):
//   - resolve_login : login -> email (public, no auth header required)
//   - create_user   : create a new admin/worker account
//   - update_password : change a user's password
//   - update_user   : update profile fields (name, phone, role, %, active)
//   - delete_user   : deactivate (soft) or hard-delete a user
//
// Authorization model:
//   - resolve_login requires no caller auth (needed before login)
//   - all other actions require a valid Supabase session (JWT)
//     in the Authorization header, and the caller's role is
//     checked against public.users before proceeding.
// =========================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const LOGIN_DOMAIN = "shoecare.local";

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

function loginToEmail(login: string) {
  return `${login.trim().toLowerCase()}@${LOGIN_DOMAIN}`;
}

// Admin client - full access via service_role key
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action as string;

    // -----------------------------------------------------
    // PUBLIC ACTION: resolve_login (no auth required)
    // -----------------------------------------------------
    if (action === "resolve_login") {
      const login = (body.login as string)?.trim().toLowerCase();
      if (!login) return json({ error: "Login kiritilmagan" }, 400);

      const { data, error } = await adminClient
        .from("users")
        .select("id")
        .eq("login", login)
        .eq("is_active", true)
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Login yoki parol noto'g'ri" }, 404);

      return json({ email: loginToEmail(login) });
    }

    // -----------------------------------------------------
    // All other actions require an authenticated caller
    // -----------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Avtorizatsiya talab qilinadi" }, 401);

    const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);
    if (callerError || !callerData?.user) {
      return json({ error: "Sessiya yaroqsiz" }, 401);
    }
    const callerId = callerData.user.id;

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("users")
      .select("id, role, company_id, is_active")
      .eq("id", callerId)
      .single();

    if (callerProfileError || !callerProfile) {
      return json({ error: "Foydalanuvchi profili topilmadi" }, 403);
    }
    if (!callerProfile.is_active) {
      return json({ error: "Hisobingiz bloklangan" }, 403);
    }

    const isSuperAdmin = callerProfile.role === "super_admin";
    const isAdmin = callerProfile.role === "admin";
    const isStaffManager = isSuperAdmin || isAdmin;

    // -----------------------------------------------------
    // ACTION: create_user
    // -----------------------------------------------------
    if (action === "create_user") {
      if (!isStaffManager) return json({ error: "Ruxsat yo'q" }, 403);

      const { login, password, full_name, phone, role, percentage, company_id } = body;

      if (!login || !password || !full_name || !role) {
        return json({ error: "Majburiy maydonlar to'ldirilmagan" }, 400);
      }
      if (password.length < 6) {
        return json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }, 400);
      }
      if (!["admin", "worker"].includes(role)) {
        return json({ error: "Noto'g'ri rol" }, 400);
      }
      // Admins can only create users in their own company
      const targetCompanyId = isSuperAdmin ? (company_id ?? callerProfile.company_id) : callerProfile.company_id;
      if (!targetCompanyId) {
        return json({ error: "Kompaniya tanlanmagan" }, 400);
      }
      // Only super_admin can create another admin
      if (role === "admin" && !isSuperAdmin) {
        return json({ error: "Faqat super admin admin qo'sha oladi" }, 403);
      }

      const normalizedLogin = String(login).trim().toLowerCase();
      if (!/^[a-z0-9_.-]{3,32}$/.test(normalizedLogin)) {
        return json(
          { error: "Login 3-32 belgi, faqat lotin harflari, raqamlar, '.', '_', '-' bo'lishi mumkin" },
          400
        );
      }

      // Check uniqueness
      const { data: existing } = await adminClient
        .from("users")
        .select("id")
        .eq("login", normalizedLogin)
        .maybeSingle();
      if (existing) {
        return json({ error: "Bu login band, boshqasini tanlang" }, 409);
      }

      const email = loginToEmail(normalizedLogin);

      const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createAuthError) {
        return json({ error: createAuthError.message }, 500);
      }

      const newUserId = createdAuth.user.id;

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
        // rollback auth user if profile insert fails
        await adminClient.auth.admin.deleteUser(newUserId);
        return json({ error: profileError.message }, 500);
      }

      return json({ id: newUserId, login: normalizedLogin });
    }

    // -----------------------------------------------------
    // ACTION: update_password
    // -----------------------------------------------------
    if (action === "update_password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password) return json({ error: "Majburiy maydonlar yo'q" }, 400);
      if (new_password.length < 6) {
        return json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" }, 400);
      }

      const isSelf = user_id === callerId;

      if (!isSelf) {
        if (!isStaffManager) return json({ error: "Ruxsat yo'q" }, 403);

        // Admin can only manage users within their own company
        if (isAdmin) {
          const { data: target } = await adminClient
            .from("users")
            .select("company_id, role")
            .eq("id", user_id)
            .maybeSingle();
          if (!target || target.company_id !== callerProfile.company_id) {
            return json({ error: "Ruxsat yo'q" }, 403);
          }
          if (target.role === "admin" || target.role === "super_admin") {
            return json({ error: "Ruxsat yo'q" }, 403);
          }
        }
      }

      const { error } = await adminClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (error) return json({ error: error.message }, 500);

      return json({ success: true });
    }

    // -----------------------------------------------------
    // ACTION: update_user (profile fields)
    // -----------------------------------------------------
    if (action === "update_user") {
      const { user_id, full_name, phone, percentage, is_active } = body;
      if (!user_id) return json({ error: "user_id talab qilinadi" }, 400);

      const isSelf = user_id === callerId;
      if (!isSelf && !isStaffManager) return json({ error: "Ruxsat yo'q" }, 403);

      if (!isSelf && isAdmin) {
        const { data: target } = await adminClient
          .from("users")
          .select("company_id, role")
          .eq("id", user_id)
          .maybeSingle();
        if (!target || target.company_id !== callerProfile.company_id) {
          return json({ error: "Ruxsat yo'q" }, 403);
        }
        if (target.role === "admin" || target.role === "super_admin") {
          return json({ error: "Ruxsat yo'q" }, 403);
        }
      }

      const updates: Record<string, unknown> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (phone !== undefined) updates.phone = phone;
      if (percentage !== undefined && isStaffManager) updates.percentage = Number(percentage);
      if (is_active !== undefined && isStaffManager && !isSelf) updates.is_active = is_active;

      if (Object.keys(updates).length === 0) {
        return json({ error: "Yangilanadigan maydon yo'q" }, 400);
      }

      const { error } = await adminClient.from("users").update(updates).eq("id", user_id);
      if (error) return json({ error: error.message }, 500);

      return json({ success: true });
    }

    return json({ error: "Noma'lum amal" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Kutilmagan xatolik" }, 500);
  }
});
