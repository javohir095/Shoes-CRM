import { supabase } from '@/lib/supabase'

export interface WorkerRanking {
  worker_id: string
  fullname: string
  branch_id: string | null
  company_id: string
  completed_orders: number
  total_revenue: number
  customers_served: number
  avg_completion_hours: number
  rank: number
}

export async function fetchWorkerRankings(): Promise<WorkerRanking[]> {
  const { data, error } = await supabase.rpc('get_worker_rankings')
  if (error) throw error
  return (data ?? []) as WorkerRanking[]
}
