import { supabase } from "@/shared/lib/supabase";
import type { AppUser, WorkerBalance } from "@/types/database.types";

export async function fetchWorkers(companyId: string): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .eq("role", "worker")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function fetchAllCompanyUsers(companyId: string): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as AppUser[];
}

export async function fetchWorkerBalance(workerId: string): Promise<WorkerBalance | null> {
  const { data, error } = await supabase
    .from("worker_balances")
    .select("*")
    .eq("worker_id", workerId)
    .maybeSingle();
  if (error) throw error;
  return data as WorkerBalance | null;
}

export async function fetchAllWorkerBalances(companyId: string): Promise<WorkerBalance[]> {
  const { data, error } = await supabase
    .from("worker_balances")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []) as WorkerBalance[];
}

export async function updateWorkerPercentage(userId: string, percentage: number) {
  const { error } = await supabase.from("users").update({ percentage }).eq("id", userId);
  if (error) throw error;
}

export async function setUserActive(userId: string, isActive: boolean) {
  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);
  if (error) throw error;
}

export interface CreateWorkerInput {
  full_name: string;
  phone: string;
  role: "worker" | "admin";
  percentage: number;
  company_id: string;
}
