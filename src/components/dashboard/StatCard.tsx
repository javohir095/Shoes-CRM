import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  accent: 'primary' | 'success' | 'warning' | 'leather' | 'indigo'
  trend?: { value: string; positive: boolean }
  loading?: boolean
  index?: number
}

const ACCENT_STYLES: Record<StatCardProps['accent'], { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  leather: { bg: 'bg-leather-400/15', text: 'text-leather-600 dark:text-leather-300' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
}

export function StatCard({ label, value, icon: Icon, accent, trend, loading, index = 0 }: StatCardProps) {
  const styles = ACCENT_STYLES[accent]

  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="mt-4 h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-28" />
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', styles.bg)}>
            <Icon className={cn('h-5 w-5', styles.text)} />
          </div>
          {trend && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                trend.positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </Card>
    </motion.div>
  )
}
