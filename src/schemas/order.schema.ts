import { z } from 'zod'
import { ORDER_STATUSES } from '@/types/database'

export const orderFormSchema = z.object({
  customer_name: z.string().min(2, 'Mijoz ismi kamida 2 belgidan iborat bo\'lsin'),
  customer_phone: z
    .string()
    .min(9, "Telefon raqami noto'g'ri")
    .regex(/^[\d+\s()-]+$/, "Telefon raqami noto'g'ri formatda"),
  telegram_id: z.string().optional().or(z.literal('')),
  shoe_type: z.string().min(2, "Oyoq kiyim turini kiriting"),
  brand: z.string().optional().or(z.literal('')),
  color: z.string().optional().or(z.literal('')),
  service_type: z.string().min(2, "Xizmat turini kiriting"),
  price: z.coerce.number().min(0, "Narx 0 dan kam bo'lmasligi kerak"),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(ORDER_STATUSES as unknown as [string, ...string[]]).optional(),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>
