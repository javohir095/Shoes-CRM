import { useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle2, Wallet, Users, Plus, ArrowRight, Building2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import { DailyOrdersChart } from '@/components/dashboard/DailyOrdersChart'
import { MonthlyRevenueChart } from '@/components/dashboard/MonthlyRevenueChart'
import { TopServicesChart } from '@/components/dashboard/TopServicesChart'
import { OrderCard } from '@/components/orders/OrderCard'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useDailyOrders,
  useDashboardStats,
  useMonthlyRevenue,
  useServiceBreakdown,
} from '@/hooks/useDashboard'
import { useRecentOrders } from '@/hooks/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { useAllCompanies } from '@/hooks/useCompanies'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { formatCurrency } from '@/lib/format'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { session, isSuperAdmin } = useAuth()

  // Company-scoped data (only loaded when user has a company)
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: dailyOrders, isLoading: dailyLoading } = useDailyOrders()
  const { data: monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue()
  const { data: services, isLoading: servicesLoading } = useServiceBreakdown()
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(5)

  // Super Admin global data
  const { data: companies } = useAllCompanies()
  const { data: subscriptions } = useSubscriptions()

  if (isSuperAdmin) {
    const totalCompanies = companies?.length ?? 0
    const pendingSubscriptions = (subscriptions ?? []).filter(
      (s) => s.status === 'pending' || s.status === 'overdue'
    ).length
    const monthlyIncome = (subscriptions ?? [])
      .filter((s) => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Xush kelibsiz{session?.fullname ? `, ${session.fullname.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Super Admin boshqaruv paneli</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Jami kompaniyalar" value={String(totalCompanies)}
            icon={Building2} accent="primary" index={0} />
          <StatCard label="Oylik daromad" value={formatCurrency(monthlyIncome)}
            icon={Wallet} accent="success" index={1} />
          <StatCard label="To'lanmagan obunalar" value={String(pendingSubscriptions)}
            icon={CreditCard} accent="warning" index={2} />
          <StatCard label="Faol kompaniyalar" value={String(totalCompanies)}
            icon={Users} accent="indigo" index={3} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Kompaniyalar</CardTitle>
              <CardDescription>So'nggi qo'shilgan kompaniyalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(companies ?? []).slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{c.name}</p>
                  </div>
                  <p className="text-sm text-primary font-semibold">{formatCurrency(c.monthly_fee)}</p>
                </div>
              ))}
              <Button variant="ghost" className="w-full" onClick={() => navigate('/companies')}>
                Barchasini ko'rish <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kutilayotgan obunalar</CardTitle>
              <CardDescription>To'lov kutilayotgan kompaniyalar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(subscriptions ?? []).filter(s => s.status === 'pending' || s.status === 'overdue').slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border px-3 py-2.5">
                  <p className="font-medium text-sm">{s.company?.name ?? 'Noma\'lum'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{formatCurrency(s.amount)}</p>
                  </div>
                </div>
              ))}
              {(subscriptions ?? []).filter(s => s.status === 'pending' || s.status === 'overdue').length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">Barcha obunalar to'langan</p>
              )}
              <Button variant="ghost" className="w-full" onClick={() => navigate('/subscriptions')}>
                Obunalarni boshqarish <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Xush kelibsiz{session?.fullname ? `, ${session.fullname.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Bugungi holatga umumiy nazar</p>
        </div>
        <Button onClick={() => navigate('/orders?new=1')} size="lg">
          <Plus className="h-4 w-4" />
          Yangi buyurtma
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Bugungi buyurtmalar" value={String(stats?.todayOrders ?? 0)}
          icon={ClipboardList} accent="primary" loading={statsLoading} index={0} />
        <StatCard label="Jarayondagi buyurtmalar" value={String(stats?.inProgressOrders ?? 0)}
          icon={Clock} accent="warning" loading={statsLoading} index={1} />
        <StatCard label="Tayyor buyurtmalar" value={String(stats?.readyOrders ?? 0)}
          icon={CheckCircle2} accent="success" loading={statsLoading} index={2} />
        <StatCard label="Oylik daromad" value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          icon={Wallet} accent="leather" loading={statsLoading} index={3} />
        <StatCard label="Jami mijozlar" value={String(stats?.totalCustomers ?? 0)}
          icon={Users} accent="indigo" loading={statsLoading} index={4} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyOrdersChart data={dailyOrders ?? []} loading={dailyLoading} />
        </div>
        <TopServicesChart data={services ?? []} loading={servicesLoading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyRevenueChart data={monthlyRevenue ?? []} loading={revenueLoading} />
        </div>

        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>So'nggi buyurtmalar</CardTitle>
              <CardDescription>Eng yangi qabul qilingan buyurtmalar</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {ordersLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[78px] w-full" />)
            ) : recentOrders?.orders.length ? (
              recentOrders.orders.map((order, i) => <OrderCard key={order.id} order={order} index={i} />)
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <ClipboardList className="mb-2 h-8 w-8 opacity-40" />
                Hozircha buyurtmalar yo'q
              </div>
            )}
            <Button variant="ghost" className="w-full" onClick={() => navigate('/orders')}>
              Barchasini ko'rish
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
