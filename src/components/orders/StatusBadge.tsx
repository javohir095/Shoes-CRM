import { cn } from '@/lib/utils'
import { STATUS_STYLES } from '@/lib/status'
import type { OrderStatus } from '@/types/database'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        style.className,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dotClassName)} />
      {style.label}
    </span>
  )
}
