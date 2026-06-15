import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { SalaryPayment } from "@/types/database.types";
import { toast } from "sonner";

export async function fetchSalaryPayments(workerId: string): Promise<SalaryPayment[]> {
  const { data, error } = await supabase
    .from("salary_payments")
    .select("*")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SalaryPayment[];
}

export async function fetchPendingSalaryPayments(companyId: string): Promise<SalaryPayment[]> {
  const { data, error } = await supabase
    .from("salary_payments")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SalaryPayment[];
}

export async function createSalaryPayment(input: {
  company_id: string;
  worker_id: string;
  amount: number;
  paid_by: string;
}) {
  const { error } = await supabase.from("salary_payments").insert({ ...input, status: "pending" });
  if (error) throw error;
}

export async function confirmSalaryPayment(paymentId: string) {
  const { error } = await supabase
    .from("salary_payments")
    .update({ status: "confirmed" })
    .eq("id", paymentId);
  if (error) throw error;
}

export function useSalaryPayments(workerId: string | undefined) {
  return useQuery({
    queryKey: ["salary-payments", workerId],
    queryFn: () => fetchSalaryPayments(workerId as string),
    enabled: !!workerId,
  });
}

export function useCompanySalaryPayments(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-salary-payments", companyId],
    queryFn: () => fetchPendingSalaryPayments(companyId as string),
    enabled: !!companyId,
  });
}

export function useCreateSalaryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSalaryPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["salary-payments"] });
      toast.success("To'lov yaratildi, ishchi tasdiqlashini kutmoqda");
    },
    onError: (err: Error) => toast.error(err.message || "Xatolik yuz berdi"),
  });
}

export function useConfirmSalaryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmSalaryPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["company-salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["worker-balance"] });
      queryClient.invalidateQueries({ queryKey: ["worker-balances"] });
      toast.success("To'lov tasdiqlandi");
    },
    onError: (err: Error) => toast.error(err.message || "Xatolik yuz berdi"),
  });
}
