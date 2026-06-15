import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Order } from "@/types/database.types";

export interface DashboardStats {
  todayOrders: number;
  inProgressOrders: number;
  readyOrders: number;
  monthlyRevenue: number;
  totalCustomers: number;
  cancelledOrders: number;
}

const IN_PROGRESS_STATUSES = ["qabul_qilindi", "diagnostika", "tozalanmoqda", "tamirlanmoqda"];

export async function fetchDashboardStats(companyId: string | null): Promise<DashboardStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let baseQuery = supabase.from("orders").select("*", { count: "exact", head: false });
  if (companyId) baseQuery = baseQuery.eq("company_id", companyId);

  const [{ data: allOrders, error }] = await Promise.all([
    baseQuery.gte("created_at", startOfMonth.toISOString()),
  ]);
  if (error) throw error;

  const orders = (allOrders ?? []) as Order[];

  const todayOrders = orders.filter((o) => new Date(o.created_at) >= startOfToday).length;
  const inProgressOrders = orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status)).length;
  const readyOrders = orders.filter((o) => o.status === "tayyor").length;
  const cancelledOrders = orders.filter((o) => o.status === "bekor_qilindi").length;
  const monthlyRevenue = orders
    .filter((o) => o.status === "tugallangan")
    .reduce((sum, o) => sum + Number(o.price), 0);

  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone));

  return {
    todayOrders,
    inProgressOrders,
    readyOrders,
    monthlyRevenue,
    totalCustomers: uniqueCustomers.size,
    cancelledOrders,
  };
}

export interface DailyOrdersPoint {
  date: string;
  count: number;
}

export async function fetchDailyOrders(companyId: string | null, days = 14): Promise<DailyOrdersPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  let query = supabase.from("orders").select("created_at").gte("created_at", since.toISOString());
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    counts.set(key, 0);
  }

  for (const row of data ?? []) {
    const key = new Date(row.created_at as string).toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export interface ServiceTypeStat {
  service_type: string;
  count: number;
}

export async function fetchServiceTypeStats(companyId: string | null): Promise<ServiceTypeStat[]> {
  let query = supabase.from("orders").select("service_type");
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.service_type as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([service_type, count]) => ({ service_type, count }));
}

export function useDashboardStats(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["dashboard-stats", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchDashboardStats(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}

export function useDailyOrders(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["daily-orders", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchDailyOrders(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}

export function useServiceTypeStats(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["service-type-stats", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchServiceTypeStats(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}
