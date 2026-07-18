// =========================================================
// Database types - mirrors supabase/migrations/*.sql
// =========================================================

export type UserRole = "super_admin" | "admin" | "worker";

export type OrderStatus =
  | "qabul_qilindi"
  | "diagnostika"
  | "tozalanmoqda"
  | "tamirlanmoqda"
  | "tayyor"
  | "topshirildi"
  | "tugallangan"
  | "bekor_qilindi";

export type PaymentMethod =
  | "naqd"
  | "uzcard"
  | "humo"
  | "click"
  | "payme"
  | "bank_otkazma";

export type ServiceType =
  | "tozalash"
  | "tamirlash"
  | "bo_yash"
  | "tozalash_va_tamirlash"
  | "boshqa";

export type NotificationType =
  | "order_created"
  | "status_changed"
  | "order_ready"
  | "salary_paid"
  | "system";

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  receipt_footer_text: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  company_id: string | null;
  full_name: string;
  phone: string | null;
  role: UserRole;
  login: string | null;
  percentage: number;
  avatar_url: string | null;
  pin_code_hash: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  order_number: string;
  worker_id: string | null;
  customer_id: string | null;

  customer_name: string;
  customer_phone: string;
  customer_telegram_id: number | null;

  shoe_type: string;
  brand: string | null;
  color: string | null;
  service_type: ServiceType;
  price: number;
  comment: string | null;

  status: OrderStatus;

  payment_method: PaymentMethod | null;
  paid_at: string | null;

  worker_percentage: number | null;
  worker_earning: number | null;

  estimated_ready_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface OrderImage {
  id: string;
  order_id: string;
  image_url: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  comment: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  received_by: string | null;
  created_at: string;
}

export interface WorkerBalance {
  id: string;
  worker_id: string;
  company_id: string;
  total_earned: number;
  total_paid: number;
  current_balance: number;
  avg_rating: number;
  total_reviews: number;
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
  on_time_orders: number;
  total_orders: number;
  updated_at: string;
}

export interface SalaryPayment {
  id: string;
  company_id: string;
  worker_id: string;
  amount: number;
  paid_by: string | null;
  status: "pending" | "confirmed";
  confirmed_at: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  company_id: string | null;
  user_id: string | null;
  telegram_user_id: number | null;
  type: NotificationType;
  title: string | null;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TelegramUser {
  id: string;
  telegram_id: number;
  company_id: string | null;
  phone: string | null;
  full_name: string | null;
  username: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  company_id: string;
  order_id: string;
  worker_id: string | null;
  customer_id: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
}

export interface WorkerRanking {
  worker_id: string;
  company_id: string | null;
  full_name: string;
  total_orders: number;
  on_time_orders: number;
  total_earned: number;
  avg_rating: number;
  total_reviews: number;
  score: number;
}

export interface CompanySatisfactionStats {
  company_id: string;
  company_name: string;
  avg_rating: number;
  total_reviews: number;
  best_worker_id: string | null;
}
