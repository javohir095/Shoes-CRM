import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Payment, PaymentMethod } from "@/types/database.types";

export interface FinanceSummary {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  byMethod: Record<PaymentMethod, number>;
}

export async function fetchFinanceSummary(companyId: string | null): Promise<FinanceSummary> {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let query = supabase
    .from("payments")
    .select("*")
    .gte("created_at", startOfYear.toISOString());
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;

  const payments = (data ?? []) as Payment[];

  const sumSince = (date: Date) =>
    payments.filter((p) => new Date(p.created_at) >= date).reduce((s, p) => s + Number(p.amount), 0);

  const byMethod: Record<string, number> = {};
  for (const p of payments) {
    byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
  }

  return {
    daily: sumSince(startOfDay),
    weekly: sumSince(startOfWeek),
    monthly: sumSince(startOfMonth),
    yearly: sumSince(startOfYear),
    byMethod: byMethod as Record<PaymentMethod, number>,
  };
}

export function useFinanceSummary(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["finance-summary", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchFinanceSummary(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}
