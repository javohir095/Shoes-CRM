import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DailyOrdersChart } from '@/components/dashboard/DailyOrdersChart'
import { MonthlyRevenueChart } from '@/components/dashboard/MonthlyRevenueChart'
import { TopServicesChart } from '@/components/dashboard/TopServicesChart'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  useDailyOrders,
  useDashboardStats,
  useMonthlyRevenue,
  useServiceBreakdown,
  useStatusDistribution,
} from '@/hooks/useDashboard'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database'
import { STATUS_STYLES } from '@/lib/status'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, Wallet, Package, Users } from 'lucide-react'

const STATUS_COLORS: Record<OrderStatus, string> = {
  qabul_qilindi: 'hsl(215 20% 65%)',
  diagnostika: 'hsl(265 70% 65%)',
  tozalanmoqda: 'hsl(199 89% 55%)',
  "ta'mirlanmoqda": 'hsl(38 92% 55%)',
  tayyor: 'hsl(160 70% 45%)',
  topshirildi: 'hsl(230 80% 60%)',
  bekor_qilindi: 'hsl(0 75% 60%)',
}

export function StatisticsPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: dailyOrders, isLoading: dailyLoading } = useDailyOrders(30)
  const { data: monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue(12)
  const { data: services, isLoading: servicesLoading } = useServiceBreakdown()
  const { data: statusDist, isLoading: statusLoading } = useStatusDistribution()

  const totalOrders = (statusDist ?? []).reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistika</h1>
        <p className="text-sm text-muted-foreground">Biznesingiz bo'yicha chuqur tahlil va hisobotlar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Jami buyurtmalar"
          value={String(totalOrders)}
          icon={Package}
          accent="primary"
          loading={statusLoading}
        />
        <StatCard
          label="Oylik daromad"
          value={stats ? formatCurrency(stats.monthlyRevenue) : '—'}
          icon={Wallet}
          accent="success"
          loading={statsLoading}
        />
        <StatCard
          label="Jami mijozlar"
          value={String(stats?.totalCustomers ?? 0)}
          icon={Users}
          accent="indigo"
          loading={statsLoading}
        />
        <StatCard
          label="Jarayondagi"
          value={String(stats?.inProgressOrders ?? 0)}
          icon={TrendingUp}
          accent="leather"
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailyOrdersChart data={dailyOrders ?? []} loading={dailyLoading} />

        <Card>
          <CardHeader>
            <CardTitle>Status bo'yicha taqsimot</CardTitle>
            <CardDescription>Barcha buyurtmalarning holat bo'yicha ulushi</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : !statusDist || statusDist.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Ma'lumot yo'q
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statusDist.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status as OrderStatus]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '0.8rem',
                    }}
                    formatter={(value: number, _name, entry) => [
                      `${value} ta`,
                      ORDER_STATUS_LABELS[(entry?.payload?.status ?? 'qabul_qilindi') as OrderStatus],
                    ]}
                  />
                  <Legend
                    formatter={(value) => ORDER_STATUS_LABELS[value as OrderStatus] ?? value}
                    wrapperStyle={{ fontSize: '0.75rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyRevenueChart data={monthlyRevenue ?? []} loading={revenueLoading} />
        <TopServicesChart data={services ?? []} loading={servicesLoading} />
      </div>

      {/* Status legend cards */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Holatlar bo'yicha sonlar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {(statusDist ?? []).map((s) => (
            <div
              key={s.status}
              className={`rounded-xl border p-3 text-center ${STATUS_STYLES[s.status as OrderStatus].className}`}
            >
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="mt-1 text-xs font-medium">{ORDER_STATUS_LABELS[s.status as OrderStatus]}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default StatisticsPage
