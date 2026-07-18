import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import type { OrderFilters } from '@/types'
import type { OrderStatus } from '@/types/database'
import type { OrderFormValues } from '@/schemas/order.schema'
import {
  createOrder,
  deleteOrder,
  deleteOrderImage,
  fetchOrderById,
  fetchOrders,
  updateOrder,
  updateOrderStatus,
  uploadOrderImage,
} from '@/services/orders.service'

export function useOrders(filters: OrderFilters, page = 1, pageSize = 20) {
  const { session, isSuperAdmin } = useAuth()
  const companyId = session?.company_id ?? null

  return useQuery({
    queryKey: ['orders', companyId, filters, page, pageSize],
    queryFn: () => fetchOrders(companyId, filters, page, pageSize),
    enabled: !!session && (!!companyId || isSuperAdmin),
    placeholderData: (prev) => prev,
  })
}

export function useRecentOrders(limit = 5) {
  const { session, isSuperAdmin } = useAuth()
  const companyId = session?.company_id ?? null

  return useQuery({
    queryKey: ['orders', companyId, 'recent', limit],
    queryFn: () => fetchOrders(companyId, {}, 1, limit),
    enabled: !!session && (!!companyId || isSuperAdmin),
  })
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId!),
    enabled: !!orderId,
  })
}

export function useCreateOrder() {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: OrderFormValues) =>
      createOrder(session!.company_id as string, session!.userId, values),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['daily-orders'] })
      toast.success(`Buyurtma yaratildi: ${order.order_number}`)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Buyurtma yaratishda xatolik')
    },
  })
}

export function useUpdateOrder(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: Partial<OrderFormValues>) => updateOrder(orderId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success('Buyurtma yangilandi')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Yangilashda xatolik')
    },
  })
}

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Holat yangilandi')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Holatni yangilashda xatolik')
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success("Buyurtma o'chirildi")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "O'chirishda xatolik")
    },
  })
}

export function useUploadOrderImage(orderId: string) {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadOrderImage(session!.company_id as string, orderId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success('Rasm yuklandi')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Rasm yuklashda xatolik')
    },
  })
}

export function useDeleteOrderImage(orderId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageId: string) => deleteOrderImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success("Rasm o'chirildi")
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Rasmni o'chirishda xatolik")
    },
  })
}
