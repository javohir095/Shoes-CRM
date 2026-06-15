import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders,
  fetchOrderById,
  fetchOrderImages,
  fetchStatusHistory,
  fetchOrderByNumberOrId,
  createOrder,
  updateOrderStatus,
  completeOrderWithPayment,
  uploadOrderImage,
  type OrderFilters,
  type CreateOrderInput,
  type CompleteOrderInput,
} from "@/features/orders/api/orders-api";
import type { OrderStatus } from "@/types/database.types";
import { toast } from "sonner";

export const ordersKeys = {
  all: ["orders"] as const,
  list: (filters: OrderFilters) => ["orders", "list", filters] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  images: (id: string) => ["orders", "images", id] as const,
  history: (id: string) => ["orders", "history", id] as const,
  byCode: (code: string) => ["orders", "code", code] as const,
};

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ordersKeys.list(filters),
    queryFn: () => fetchOrders(filters),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.detail(id ?? ""),
    queryFn: () => fetchOrderById(id as string),
    enabled: !!id,
  });
}

export function useOrderByCode(code: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.byCode(code ?? ""),
    queryFn: () => fetchOrderByNumberOrId(code as string),
    enabled: !!code,
  });
}

export function useOrderImages(orderId: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.images(orderId ?? ""),
    queryFn: () => fetchOrderImages(orderId as string),
    enabled: !!orderId,
  });
}

export function useStatusHistory(orderId: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.history(orderId ?? ""),
    queryFn: () => fetchStatusHistory(orderId as string),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      toast.success(`Buyurtma yaratildi: ${order.order_number}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Buyurtma yaratishda xatolik");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: ordersKeys.history(order.id) });
      toast.success("Status yangilandi");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Statusni yangilashda xatolik");
    },
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompleteOrderInput) => completeOrderWithPayment(input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      queryClient.invalidateQueries({ queryKey: ordersKeys.detail(order.id) });
      toast.success("To'lov qabul qilindi va buyurtma yakunlandi");
    },
    onError: (err: Error) => {
      toast.error(err.message || "To'lovni amalga oshirishda xatolik");
    },
  });
}

export function useUploadOrderImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      file,
      uploadedBy,
    }: {
      orderId: string;
      file: File;
      uploadedBy: string;
    }) => uploadOrderImage(orderId, file, uploadedBy),
    onSuccess: (_url, variables) => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.images(variables.orderId) });
      toast.success("Rasm yuklandi");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Rasm yuklashda xatolik");
    },
  });
}
