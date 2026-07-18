import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  Calendar,
  Footprints,
  ImagePlus,
  Loader2,
  Palette,
  Phone,
  Save,
  Send,
  Tag,
  Trash2,
  User as UserIcon,
  Wrench,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { SoleStepper } from '@/components/orders/SoleStepper'
import { useAuth } from '@/hooks/useAuth'
import {
  useDeleteOrder,
  useDeleteOrderImage,
  useOrder,
  useUpdateOrder,
  useUpdateOrderStatus,
  useUploadOrderImage,
} from '@/hooks/useOrders'
import { orderFormSchema, type OrderFormValues } from '@/schemas/order.schema'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { OrderStatus } from '@/types/database'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { data: order, isLoading } = useOrder(id)
  const updateOrder = useUpdateOrder(id ?? '')
  const updateStatus = useUpdateOrderStatus(id ?? '')
  const uploadImage = useUploadOrderImage(id ?? '')
  const deleteImage = useDeleteOrderImage(id ?? '')
  const deleteOrder = useDeleteOrder()

  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    values: order
      ? {
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          telegram_id: order.telegram_id ?? '',
          shoe_type: order.shoe_type,
          brand: order.brand ?? '',
          color: order.color ?? '',
          service_type: order.service_type,
          price: order.price,
          notes: order.notes ?? '',
        }
      : undefined,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-medium">Buyurtma topilmadi</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-4 w-4" />
          Buyurtmalarga qaytish
        </Button>
      </div>
    )
  }

  const onSubmit = (values: OrderFormValues) => {
    updateOrder.mutate(values, {
      onSuccess: () => setEditing(false),
    })
  }

  const handleStatusChange = (status: OrderStatus) => {
    if (status === order.status) return
    updateStatus.mutate(status)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => uploadImage.mutate(file))
    e.target.value = ''
  }

  const handleDelete = () => {
    deleteOrder.mutate(order.id, {
      onSuccess: () => navigate('/orders'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-semibold tracking-tight">{order.order_number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.created_at)} • {order.worker?.fullname ?? "Noma'lum"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Tahrirlash
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" />
              O'chirish
            </Button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <Card className="p-5">
        <h2 className="mb-5 text-sm font-semibold text-muted-foreground">Buyurtma holati</h2>
        <SoleStepper status={order.status} onStatusChange={handleStatusChange} interactive />
        <div className="mt-4 flex flex-wrap gap-2">
          {updateStatus.isPending && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Yangilanmoqda...
            </span>
          )}
          {order.status !== 'bekor_qilindi' && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={() => handleStatusChange('bekor_qilindi')}
            >
              Buyurtmani bekor qilish
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Order info / edit form */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Buyurtma ma'lumotlari</h2>
            {editing && (
              <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(false); reset() }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Mijoz ismi</Label>
                  <Input {...register('customer_name')} />
                  {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon raqami</Label>
                  <Input {...register('customer_phone')} />
                  {errors.customer_phone && <p className="text-xs text-destructive">{errors.customer_phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Telegram ID</Label>
                  <Input {...register('telegram_id')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Oyoq kiyim turi</Label>
                  <Input {...register('shoe_type')} />
                  {errors.shoe_type && <p className="text-xs text-destructive">{errors.shoe_type.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Brend</Label>
                  <Input {...register('brand')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rang</Label>
                  <Input {...register('color')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Xizmat turi</Label>
                  <Input {...register('service_type')} />
                  {errors.service_type && <p className="text-xs text-destructive">{errors.service_type.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Narx (so'm)</Label>
                  <Input type="number" step="1000" {...register('price')} />
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Izoh</Label>
                <Textarea rows={3} {...register('notes')} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setEditing(false); reset() }}>
                  Bekor qilish
                </Button>
                <Button type="submit" disabled={updateOrder.isPending}>
                  {updateOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Saqlash
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={UserIcon} label="Mijoz ismi" value={order.customer_name} />
              <InfoRow icon={Phone} label="Telefon raqami" value={order.customer_phone} />
              {order.telegram_id && <InfoRow icon={Send} label="Telegram ID" value={order.telegram_id} />}
              <InfoRow icon={Footprints} label="Oyoq kiyim turi" value={order.shoe_type} />
              {order.brand && <InfoRow icon={Tag} label="Brend" value={order.brand} />}
              {order.color && <InfoRow icon={Palette} label="Rang" value={order.color} />}
              <InfoRow icon={Wrench} label="Xizmat turi" value={order.service_type} />
              <InfoRow icon={Calendar} label="Qabul qilingan sana" value={formatDateTime(order.created_at)} />
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Izoh</p>
                  <p className="mt-1 text-sm leading-relaxed">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Price + images */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Narx</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatCurrency(order.price)}</p>
          </Card>

          {order.company?.bot_username && (
            <Card className="flex flex-col items-center gap-3 p-5 text-center">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Mijoz uchun QR kod
              </h2>
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG
                  value={`https://t.me/${order.company.bot_username}?start=${order.order_number}`}
                  size={160}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mijoz skaner qilganda Telegram botda buyurtma holati darhol ko'rsatiladi
              </p>
            </Card>
          )}

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Rasmlar</h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploadImage.isPending}
                />
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent">
                  {uploadImage.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  Yuklash
                </span>
              </label>
            </div>

            {order.images && order.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {order.images.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border">
                    <img src={img.image_url} alt="Buyurtma rasmi" className="h-full w-full object-cover" />
                    <button
                      onClick={() => deleteImage.mutate(img.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">Rasmlar yuklanmagan</p>
            )}
          </Card>
        </div>
      </div>

      {/* Status history */}
      {order.status_history && order.status_history.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">O'zgarishlar tarixi</h2>
          <div className="space-y-3">
            {order.status_history
              .slice()
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 border-b pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {h.old_status && <StatusBadge status={h.old_status} />}
                    {h.old_status && <span className="text-muted-foreground">→</span>}
                    <StatusBadge status={h.new_status} />
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{h.changed_by_user?.fullname ?? "Noma'lum"}</p>
                    <p>{formatDateTime(h.created_at)}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </Card>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buyurtmani o'chirish</DialogTitle>
            <DialogDescription>
              {order.order_number} raqamli buyurtmani o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteOrder.isPending}>
              {deleteOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

export default OrderDetailPage
