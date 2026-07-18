import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { fetchWorkerRankings } from '@/services/rankings.service'

export function useWorkerRankings() {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['worker-rankings', session?.userId],
    queryFn: fetchWorkerRankings,
    enabled: !!session,
  })
}
