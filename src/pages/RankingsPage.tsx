import { motion } from 'framer-motion'
import { Trophy, Medal, Award, ClipboardCheck, Users2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useWorkerRankings } from '@/hooks/useRankings'
import { formatCurrency, getInitials } from '@/lib/format'

const MEDAL_STYLES: Record<number, { icon: React.ElementType; className: string }> = {
  1: { icon: Trophy, className: 'text-amber-500 bg-amber-500/10' },
  2: { icon: Medal, className: 'text-slate-400 bg-slate-400/10' },
  3: { icon: Award, className: 'text-orange-600 bg-orange-600/10' },
}

export function RankingsPage() {
  const { isWorker, session } = useAuth()
  const { data: rankings, isLoading } = useWorkerRankings()

  const maxRevenue = Math.max(1, ...(rankings ?? []).map((r) => r.total_revenue))
  const ownRow = rankings?.find((r) => r.worker_id === session?.userId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reyting</h1>
        <p className="text-sm text-muted-foreground">
          {isWorker
            ? "Sizning ko'rsatkichlaringiz va umumiy reytingdagi o'rningiz"
            : "Xodimlar samaradorligi bo'yicha TOP reyting"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : isWorker ? (
        ownRow ? (
          <RankingRow ranking={ownRow} maxRevenue={maxRevenue} highlight />
        ) : (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Hozircha ko'rsatkichlaringiz mavjud emas
          </Card>
        )
      ) : rankings && rankings.length > 0 ? (
        <div className="space-y-3">
          {rankings.map((ranking, i) => (
            <motion.div
              key={ranking.worker_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <RankingRow ranking={ranking} maxRevenue={maxRevenue} />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-sm text-muted-foreground">Ma'lumot yo'q</Card>
      )}
    </div>
  )
}

function RankingRow({
  ranking,
  maxRevenue,
  highlight,
}: {
  ranking: {
    worker_id: string
    fullname: string
    rank: number
    completed_orders: number
    total_revenue: number
    customers_served: number
    avg_completion_hours: number
  }
  maxRevenue: number
  highlight?: boolean
}) {
  const medal = MEDAL_STYLES[ranking.rank]
  const progress = Math.min(100, (ranking.total_revenue / maxRevenue) * 100)

  return (
    <Card className={highlight ? 'border-primary/40 p-5' : 'p-5'}>
      <div className="flex items-center gap-4">
        <div
          className={
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ' +
            (medal ? medal.className : 'bg-secondary text-muted-foreground')
          }
        >
          {medal ? <medal.icon className="h-5 w-5" /> : `#${ranking.rank}`}
        </div>

        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-sm text-primary">
            {getInitials(ranking.fullname)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{ranking.fullname}</p>
          <div className="mt-1.5 h-1.5 w-full max-w-xs rounded-full bg-secondary">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-4 text-right sm:flex">
          <Stat icon={ClipboardCheck} value={ranking.completed_orders} label="buyurtma" />
          <Stat icon={Users2} value={ranking.customers_served} label="mijoz" />
          <Stat icon={Clock} value={`${ranking.avg_completion_hours.toFixed(1)}s`} label="o'rtacha" />
          <div>
            <p className="text-sm font-semibold">{formatCurrency(ranking.total_revenue)}</p>
            <p className="text-xs text-muted-foreground">daromad</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function Stat({ icon: Icon, value, label }: { icon: React.ElementType; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1 text-sm font-semibold">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default RankingsPage
