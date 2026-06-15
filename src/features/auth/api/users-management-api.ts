import { supabase } from "@/shared/lib/supabase";

const FUNCTION_NAME = "manage-users";

async function callManageUsers<T>(body: Record<string, unknown>, withAuth = true): Promise<T> {
  const headers: Record<string, string> = {};

  if (withAuth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const { data, error } = await supabase.functions.invoke<T>(FUNCTION_NAME, {
    body,
    headers,
  });

  if (error) {
    // Try to extract a meaningful message from the function's JSON error body
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

  // Edge function returns { error } with 4xx/5xx status even on "success" invoke in some cases
  if (data && typeof data === "object" && "error" in (data as Record<string, unknown>)) {
    const err = (data as Record<string, unknown>).error;
    if (err) throw new Error(String(err));
  }

  return data as T;
}

export async function resolveLogin(login: string): Promise<{ email: string }> {
  return callManageUsers<{ email: string }>({ action: "resolve_login", login }, false);
}

export interface CreateUserInput {
  login: string;
  password: string;
  full_name: string;
  phone?: string;
  role: "admin" | "worker";
  percentage?: number;
  company_id?: string; // only used by super_admin
}

export async function createUserAccount(input: CreateUserInput) {
  return callManageUsers<{ id: string; login: string }>({ action: "create_user", ...input });
}

export async function updateUserPassword(userId: string, newPassword: string) {
  return callManageUsers<{ success: true }>({
    action: "update_password",
    user_id: userId,
    new_password: newPassword,
  });
}

export interface UpdateUserInput {
  user_id: string;
  full_name?: string;
  phone?: string;
  percentage?: number;
  is_active?: boolean;
}

export async function updateUserProfile(input: UpdateUserInput) {
  return callManageUsers<{ success: true }>({ action: "update_user", ...input });
}
