import { motion } from 'framer-motion'
import { Check, X as XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database'

interface SoleStepperProps {
  status: OrderStatus
  onStatusChange?: (status: OrderStatus) => void
  interactive?: boolean
}

/**
 * "Sole stepper" — a horizontal progress track styled like the sole of a shoe,
 * representing the order's journey through the workflow.
 */
export function SoleStepper({ status, onStatusChange, interactive = false }: SoleStepperProps) {
  const isCancelled = status === 'bekor_qilindi'
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status)

  return (
    <div className="w-full">
      {isCancelled && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          <XIcon className="h-4 w-4" />
          Bu buyurtma bekor qilingan
        </div>
      )}

      <div className="relative">
        {/* Track line */}
        <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-secondary" />
        <motion.div
          className="absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-primary to-emerald-500"
          initial={{ width: 0 }}
          animate={{
            width: isCancelled
              ? '0%'
              : `${(currentIndex / (ORDER_STATUS_FLOW.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {ORDER_STATUS_FLOW.map((step, i) => {
            const isCompleted = !isCancelled && i < currentIndex
            const isCurrent = !isCancelled && i === currentIndex
            const isClickable = interactive && !isCancelled && !!onStatusChange

            return (
              <button
                key={step}
                type="button"
                disabled={!isClickable}
                onClick={() => onStatusChange?.(step)}
                className={cn(
                  'group flex flex-col items-center gap-2 text-center',
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                )}
                style={{ flex: i === 0 || i === ORDER_STATUS_FLOW.length - 1 ? '0 0 auto' : '1 1 0%' }}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.15 : 1,
                  }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold shadow-sm transition-colors',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent &&
                      'border-primary bg-background text-primary ring-4 ring-primary/15 dark:bg-card',
                    !isCompleted &&
                      !isCurrent &&
                      'border-border bg-background text-muted-foreground dark:bg-card',
                    isClickable && 'group-hover:border-primary/60 group-hover:text-primary'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </motion.div>
                <span
                  className={cn(
                    'max-w-[5.5rem] text-xs leading-tight transition-colors',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    isClickable && 'group-hover:text-foreground'
                  )}
                >
                  {ORDER_STATUS_LABELS[step]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
