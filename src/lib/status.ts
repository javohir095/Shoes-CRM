import type { OrderStatus } from '@/types/database'
import { ORDER_STATUS_LABELS } from '@/types/database'

export interface StatusStyle {
  label: string
  className: string
  dotClassName: string
}

export const STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  qabul_qilindi: {
    label: ORDER_STATUS_LABELS.qabul_qilindi,
    className:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
    dotClassName: 'bg-slate-400',
  },
  diagnostika: {
    label: ORDER_STATUS_LABELS.diagnostika,
    className:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20',
    dotClassName: 'bg-violet-500',
  },
  tozalanmoqda: {
    label: ORDER_STATUS_LABELS.tozalanmoqda,
    className:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
    dotClassName: 'bg-sky-500',
  },
  "ta'mirlanmoqda": {
    label: ORDER_STATUS_LABELS["ta'mirlanmoqda"],
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    dotClassName: 'bg-amber-500',
  },
  tayyor: {
    label: ORDER_STATUS_LABELS.tayyor,
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    dotClassName: 'bg-emerald-500',
  },
  topshirildi: {
    label: ORDER_STATUS_LABELS.topshirildi,
    className:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20',
    dotClassName: 'bg-indigo-500',
  },
  bekor_qilindi: {
    label: ORDER_STATUS_LABELS.bekor_qilindi,
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
    dotClassName: 'bg-red-500',
  },
}
