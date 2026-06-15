import type { OrderStatus, PaymentMethod, ServiceType, UserRole } from "@/types/database.types";

export interface StatusConfig {
  label: string;
  emoji: string;
  /** Tailwind color tokens used for badges and the status rail */
  color: string;
  bg: string;
  dot: string;
}

// Order of this array also defines the "journey" shown in the status rail.
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "qabul_qilindi",
  "diagnostika",
  "tozalanmoqda",
  "tamirlanmoqda",
  "tayyor",
  "topshirildi",
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  qabul_qilindi: {
    label: "Qabul qilindi",
    emoji: "✅",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    dot: "bg-blue-500",
  },
  diagnostika: {
    label: "Diagnostika",
    emoji: "🔍",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    dot: "bg-violet-500",
  },
  tozalanmoqda: {
    label: "Tozalanmoqda",
    emoji: "🧼",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10",
    dot: "bg-cyan-500",
  },
  tamirlanmoqda: {
    label: "Ta'mirlanmoqda",
    emoji: "🔧",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
  },
  tayyor: {
    label: "Tayyor",
    emoji: "📦",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-500",
  },
  topshirildi: {
    label: "Topshirildi",
    emoji: "🎉",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    dot: "bg-teal-500",
  },
  tugallangan: {
    label: "Tugallangan",
    emoji: "💰",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-500/10",
    dot: "bg-green-500",
  },
  bekor_qilindi: {
    label: "Bekor qilindi",
    emoji: "❌",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  naqd: "Naqd pul",
  uzcard: "UzCard",
  humo: "Humo",
  click: "Click",
  payme: "Payme",
  bank_otkazma: "Bank o'tkazmasi",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  tozalash: "Tozalash",
  tamirlash: "Ta'mirlash",
  bo_yash: "Bo'yash",
  tozalash_va_tamirlash: "Tozalash va ta'mirlash",
  boshqa: "Boshqa",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  worker: "Ishchi",
};
