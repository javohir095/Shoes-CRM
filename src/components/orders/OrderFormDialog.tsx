import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { orderFormSchema, type OrderFormValues } from '@/schemas/order.schema'
import { useCreateOrder } from '@/hooks/useOrders'

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultValues: OrderFormValues = {
  customer_name: '',
  customer_phone: '',
  telegram_id: '',
  shoe_type: '',
  brand: '',
  color: '',
  service_type: '',
  price: 0,
  notes: '',
}

export function OrderFormDialog({ open, onOpenChange }: OrderFormDialogProps) {
  const createOrder = useCreateOrder()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const onSubmit = (values: OrderFormValues) => {
    createOrder.mutate(values, {
      onSuccess: () => {
        onOpenChange(false)
        reset(defaultValues)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Yangi buyurtma</DialogTitle>
          <DialogDescription>
            Mijoz va oyoq kiyim ma'lumotlarini kiriting. Buyurtma raqami avtomatik yaratiladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer_name">Mijoz ismi</Label>
              <Input
                id="customer_name"
                placeholder="Masalan: Aziz Karimov"
                {...register('customer_name')}
              />
              {errors.customer_name && (
                <p className="text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer_phone">Telefon raqami</Label>
              <Input
                id="customer_phone"
                placeholder="+998 90 123 45 67"
                {...register('customer_phone')}
              />
              {errors.customer_phone && (
                <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telegram_id">Telegram ID (ixtiyoriy)</Label>
              <Input id="telegram_id" placeholder="123456789" {...register('telegram_id')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shoe_type">Oyoq kiyim turi</Label>
              <Input
                id="shoe_type"
                placeholder="Krossovka, botinka, tufli..."
                {...register('shoe_type')}
              />
              {errors.shoe_type && (
                <p className="text-xs text-destructive">{errors.shoe_type.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand">Brend (ixtiyoriy)</Label>
              <Input id="brand" placeholder="Nike, Adidas..." {...register('brand')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="color">Rang (ixtiyoriy)</Label>
              <Input id="color" placeholder="Oq, qora..." {...register('color')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service_type">Xizmat turi</Label>
              <Input
                id="service_type"
                placeholder="Tozalash, ta'mirlash..."
                {...register('service_type')}
              />
              {errors.service_type && (
                <p className="text-xs text-destructive">{errors.service_type.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Narx (so'm)</Label>
              <Input id="price" type="number" step="1000" placeholder="50000" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="notes"
              placeholder="Qo'shimcha ma'lumotlar, defektlar tasviri..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={createOrder.isPending}>
              {createOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Buyurtma yaratish
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
