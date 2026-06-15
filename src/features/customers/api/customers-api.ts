import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Order } from "@/types/database.types";

export interface CustomerSummary {
  phone: string;
  name: string;
  telegramId: number | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export async function fetchCustomers(companyId: string | null): Promise<CustomerSummary[]> {
  let query = supabase
    .from("orders")
    .select("customer_name, customer_phone, customer_telegram_id, price, status, created_at");
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;

  const map = new Map<string, CustomerSummary>();
  for (const row of (data ?? []) as Pick<
    Order,
    "customer_name" | "customer_phone" | "customer_telegram_id" | "price" | "status" | "created_at"
  >[]) {
    const existing = map.get(row.customer_phone);
    const spent = row.status === "tugallangan" ? Number(row.price) : 0;
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += spent;
      if (new Date(row.created_at) > new Date(existing.lastOrderAt)) {
        existing.lastOrderAt = row.created_at;
        existing.name = row.customer_name;
      }
    } else {
      map.set(row.customer_phone, {
        phone: row.customer_phone,
        name: row.customer_name,
        telegramId: row.customer_telegram_id,
        orderCount: 1,
        totalSpent: spent,
        lastOrderAt: row.created_at,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  );
}

export function useCustomers(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["customers", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchCustomers(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}
