// ============================================================================
// SoleCare — Database types (hand-authored, mirrors Supabase schema)
// ============================================================================

// Core domain enums
export type UserRole = 'super_admin' | 'director' | 'admin' | 'worker'

export type OrderStatus =
  | 'qabul_qilindi'
  | 'diagnostika'
  | 'tozalanmoqda'
  | "ta'mirlanmoqda"
  | 'tayyor'
  | 'topshirildi'
  | 'bekor_qilindi'

export type SubscriptionStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'qabul_qilindi',
  'diagnostika',
  'tozalanmoqda',
  "ta'mirlanmoqda",
  'tayyor',
  'topshirildi',
  'bekor_qilindi',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  qabul_qilindi: 'Qabul qilindi',
  diagnostika: 'Diagnostika',
  tozalanmoqda: 'Tozalanmoqda',
  "ta'mirlanmoqda": "Ta'mirlanmoqda",
  tayyor: 'Tayyor',
  topshirildi: 'Topshirildi',
  bekor_qilindi: 'Bekor qilindi',
}

// Order of progression — drives the "sole stepper" UI
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'qabul_qilindi',
  'diagnostika',
  'tozalanmoqda',
  "ta'mirlanmoqda",
  'tayyor',
  'topshirildi',
]

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  director: 'Direktor',
  admin: 'Admin',
  worker: 'Ishchi',
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  pending: "To'lanmagan",
  paid: "To'langan",
  overdue: "Muddati o'tgan",
  cancelled: 'Bekor qilingan',
}

// ─── Entities ──────────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  phone: string
  monthly_fee: number
  bot_token: string | null
  bot_username: string | null
  created_at: string
}

export interface Branch {
  id: string
  company_id: string
  name: string
  address: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  // joined
  company?: Pick<Company, 'name'>
}

export interface User {
  id: string
  company_id: string
  branch_id: string | null
  fullname: string
  phone: string
  role: UserRole
  created_at: string
  // joined
  company?: Pick<Company, 'name'>
  branch?: Pick<Branch, 'name'>
}

export interface Order {
  id: string
  company_id: string
  branch_id: string | null
  order_number: string
  customer_name: string
  customer_phone: string
  telegram_id: string | null
  shoe_type: string
  brand: string | null
  color: string | null
  service_type: string
  price: number
  status: OrderStatus
  notes: string | null
  created_by: string
  created_at: string
  // joined
  images?: OrderImage[]
  worker?: Pick<User, 'id' | 'fullname'>
  status_history?: StatusHistory[]
  company?: Pick<Company, 'bot_username'>
}

export interface OrderImage {
  id: string
  order_id: string
  image_url: string
}

export interface StatusHistory {
  id: string
  order_id: string
  old_status: OrderStatus | null
  new_status: OrderStatus
  changed_by: string
  created_at: string
  changed_by_user?: Pick<User, 'fullname'>
}

export interface CompanySubscription {
  id: string
  company_id: string
  period_start: string
  period_end: string
  amount: number
  status: SubscriptionStatus
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  // joined
  company?: Pick<Company, 'name' | 'phone'>
}

export interface EmployeeSalary {
  id: string
  employee_id: string
  company_id: string
  salary_amount: number
  paid_amount: number
  remaining_amount: number
  period_month: string // YYYY-MM-DD (first of month)
  created_by: string | null
  created_at: string
  // joined
  employee?: Pick<User, 'fullname' | 'role' | 'branch_id'>
}

export type SalaryPaymentStatus = 'kutilmoqda' | 'tasdiqlangan'

export interface SalaryPayment {
  id: string
  salary_id: string
  amount: number
  note: string | null
  paid_at: string
  status: SalaryPaymentStatus
  confirmed_at: string | null
  created_by: string | null
  created_at: string
}

export const SALARY_PAYMENT_STATUS_LABELS: Record<SalaryPaymentStatus, string> = {
  kutilmoqda: 'Kutilmoqda',
  tasdiqlangan: 'Tasdiqlangan',
}

export interface OrderRating {
  id: string
  order_id: string
  worker_id: string
  company_id: string
  rating: number
  comment: string | null
  rated_at: string
}
