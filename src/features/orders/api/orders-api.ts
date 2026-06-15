import { supabase } from "@/shared/lib/supabase";
import type { Order, OrderImage, OrderStatus, StatusHistory } from "@/types/database.types";

export interface OrderFilters {
  search?: string;
  status?: OrderStatus | "all";
  workerId?: string | "all";
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.workerId && filters.workerId !== "all") {
    query = query.eq("worker_id", filters.workerId);
  }
  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }
  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

export async function fetchOrderByNumberOrId(value: string): Promise<Order | null> {
  // try by order_number first
  const { data: byNumber, error: e1 } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", value)
    .maybeSingle();
  if (e1) throw e1;
  if (byNumber) return byNumber as Order;

  // fallback: try by id (QR codes may encode the UUID)
  const { data: byId, error: e2 } = await supabase
    .from("orders")
    .select("*")
    .eq("id", value)
    .maybeSingle();
  if (e2) throw e2;
  return byId as Order | null;
}

export async function fetchOrderImages(orderId: string): Promise<OrderImage[]> {
  const { data, error } = await supabase
    .from("order_images")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrderImage[];
}

export async function fetchStatusHistory(orderId: string): Promise<StatusHistory[]> {
  const { data, error } = await supabase
    .from("status_history")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as StatusHistory[];
}

export interface CreateOrderInput {
  company_id: string;
  worker_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_telegram_id?: number | null;
  shoe_type: string;
  brand?: string | null;
  color?: string | null;
  service_type: Order["service_type"];
  price: number;
  comment?: string | null;
  estimated_ready_at?: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({ ...input, status: "qabul_qilindi" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Order;
}

export interface CompleteOrderInput {
  orderId: string;
  paymentMethod: Order["payment_method"];
  amount: number;
  receivedBy: string;
  companyId: string;
}

export async function completeOrderWithPayment(input: CompleteOrderInput): Promise<Order> {
  const { error: paymentError } = await supabase.from("payments").insert({
    company_id: input.companyId,
    order_id: input.orderId,
    amount: input.amount,
    method: input.paymentMethod,
    received_by: input.receivedBy,
  });
  if (paymentError) throw paymentError;

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "tugallangan",
      payment_method: input.paymentMethod,
      paid_at: new Date().toISOString(),
    })
    .eq("id", input.orderId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Order;
}

export async function uploadOrderImage(orderId: string, file: File, uploadedBy: string) {
  const ext = file.name.split(".").pop();
  const path = `${orderId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("order-images").upload(path, file);
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("order-images").getPublicUrl(path);

  const { error: insertError } = await supabase.from("order_images").insert({
    order_id: orderId,
    image_url: urlData.publicUrl,
    uploaded_by: uploadedBy,
  });
  if (insertError) throw insertError;

  return urlData.publicUrl;
}
