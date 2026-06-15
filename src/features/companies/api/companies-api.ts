import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import type { Company } from "@/types/database.types";
import { toast } from "sonner";

export async function fetchCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
  if (error) throw error;
  return data as Company | null;
}

export async function fetchAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Company[];
}

export interface CreateCompanyInput {
  name: string;
  legal_name?: string | null;
  phone?: string | null;
  address?: string | null;
  receipt_footer_text?: string | null;
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: input.name,
      legal_name: input.legal_name ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      receipt_footer_text: input.receipt_footer_text ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Company;
}

export interface UpdateCompanyInput {
  id: string;
  name?: string;
  legal_name?: string | null;
  phone?: string | null;
  address?: string | null;
  receipt_footer_text?: string | null;
  is_active?: boolean;
}

export async function updateCompany({ id, ...updates }: UpdateCompanyInput): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

// -----------------------------------------------------------------
// React Query hooks
// -----------------------------------------------------------------

export function useCompany(companyId: string | undefined | null) {
  return useQuery({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompany(companyId as string),
    enabled: !!companyId,
  });
}

export function useAllCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: fetchAllCompanies,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Filial yaratildi");
    },
    onError: (err: Error) => toast.error(err.message || "Xatolik yuz berdi"),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company", company.id] });
      toast.success("Filial yangilandi");
    },
    onError: (err: Error) => toast.error(err.message || "Xatolik yuz berdi"),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Filial o'chirildi");
    },
    onError: (err: Error) => toast.error(err.message || "Xatolik yuz berdi"),
  });
}
