export interface Company {
  id: string
  name: string
  bot_token: string | null
  bot_username: string | null
}

export interface Order {
  id: string
  company_id: string
  created_by: string
  order_number: string
  customer_name: string
  customer_phone: string
  telegram_id: string | null
  shoe_type: string
  service_type: string
  price: number
  status: string
  created_at: string
}

export const STATUS_LABELS: Record<string, string> = {
  qabul_qilindi: 'Qabul qilindi',
  diagnostika: 'Diagnostika',
  tozalanmoqda: 'Tozalanmoqda',
  "ta'mirlanmoqda": "Ta'mirlanmoqda",
  tayyor: 'Tayyor ✅',
  topshirildi: 'Topshirildi',
  bekor_qilindi: 'Bekor qilindi ❌',
}

export interface BotSession {
  waitingForOrderNumber?: boolean
  lastOrderId?: string
}
