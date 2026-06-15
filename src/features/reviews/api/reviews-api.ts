import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Review, WorkerRanking, CompanySatisfactionStats } from "@/types/database.types";

export async function fetchTopWorkers(companyId: string | null, limit = 10): Promise<WorkerRanking[]> {
  let query = supabase.from("worker_rankings").select("*").order("score", { ascending: false }).limit(limit);
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WorkerRanking[];
}

export async function fetchCompanySatisfaction(companyId: string | null): Promise<CompanySatisfactionStats | null> {
  let query = supabase.from("company_satisfaction_stats").select("*");
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return null;

  if (companyId) return data[0] as CompanySatisfactionStats;

  // Super admin: aggregate across all companies
  const rows = data as CompanySatisfactionStats[];
  const totalReviews = rows.reduce((sum, r) => sum + r.total_reviews, 0);
  const weightedSum = rows.reduce((sum, r) => sum + r.avg_rating * r.total_reviews, 0);
  const best = rows.sort((a, b) => b.avg_rating - a.avg_rating)[0];

  return {
    company_id: "all",
    company_name: "Barcha filiallar",
    avg_rating: totalReviews > 0 ? Math.round((weightedSum / totalReviews) * 100) / 100 : 0,
    total_reviews: totalReviews,
    best_worker_id: best?.best_worker_id ?? null,
  };
}

export async function fetchReviews(companyId: string | null): Promise<Review[]> {
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (companyId) query = query.eq("company_id", companyId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Review[];
}

export function useTopWorkers(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["top-workers", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchTopWorkers(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}

export function useCompanySatisfaction(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["company-satisfaction", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchCompanySatisfaction(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}

export function useReviews(companyId: string | null | undefined, isSuperAdmin: boolean) {
  return useQuery({
    queryKey: ["reviews", isSuperAdmin ? "all" : companyId],
    queryFn: () => fetchReviews(isSuperAdmin ? null : (companyId as string)),
    enabled: isSuperAdmin || !!companyId,
  });
}
