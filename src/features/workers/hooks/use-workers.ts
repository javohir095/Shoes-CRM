import { useQuery } from "@tanstack/react-query";
import {
  fetchWorkers,
  fetchAllCompanyUsers,
  fetchWorkerBalance,
  fetchAllWorkerBalances,
} from "@/features/workers/api/workers-api";

export function useWorkers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["workers", companyId],
    queryFn: () => fetchWorkers(companyId as string),
    enabled: !!companyId,
  });
}

export function useCompanyUsers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-users", companyId],
    queryFn: () => fetchAllCompanyUsers(companyId as string),
    enabled: !!companyId,
  });
}

export function useWorkerBalance(workerId: string | undefined) {
  return useQuery({
    queryKey: ["worker-balance", workerId],
    queryFn: () => fetchWorkerBalance(workerId as string),
    enabled: !!workerId,
  });
}

export function useAllWorkerBalances(companyId: string | undefined) {
  return useQuery({
    queryKey: ["worker-balances", companyId],
    queryFn: () => fetchAllWorkerBalances(companyId as string),
    enabled: !!companyId,
  });
}
