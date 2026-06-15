import {
  ClipboardList,
  Loader,
  PackageCheck,
  Wallet,
  Users,
  XCircle,
  Star,
  Trophy,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/widgets/dashboard/stat-card";
import { useAuthStore } from "@/features/auth/store/auth-store";
import {
  useDashboardStats,
  useDailyOrders,
  useServiceTypeStats,
} from "@/features/dashboard/api/dashboard-api";
import { useTopWorkers, useCompanySatisfaction } from "@/features/reviews/api/reviews-api";
import { formatCurrency, formatDateShort } from "@/shared/lib/utils";
import { SERVICE_TYPE_LABELS } from "@/shared/constants/orders";
import { ROLE_LABELS } from "@/shared/constants/orders";

const PIE_COLORS = ["#5B8DEF", "#C8A27A", "#34D399", "#FBBF24", "#A78BFA"];

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const isSuperAdmin = profile?.role === "super_admin";
  const companyId = profile?.company_id;

  const { data: stats, isLoading: statsLoading } = useDashboardStats(companyId, isSuperAdmin);
  const { data: dailyOrders } = useDailyOrders(companyId, isSuperAdmin);
  const { data: serviceStats } = useServiceTypeStats(companyId, isSuperAdmin);
  const { data: topWorkers } = useTopWorkers(companyId, isSuperAdmin);
  const { data: satisfaction } = useCompanySatisfaction(companyId, isSuperAdmin);

  return (
    <div>
      <PageHeader
        title={`Salom, ${profile?.full_name?.split(" ")[0] ?? ""} 👋`}
        description={profile ? ROLE_LABELS[profile.role] : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Bugungi buyurtmalar"
          value={stats?.todayOrders ?? 0}
          icon={<ClipboardList className="h-[18px] w-[18px]" />}
          loading={statsLoading}
          index={0}
        />
        <StatCard
          label="Jarayondagi"
          value={stats?.inProgressOrders ?? 0}
          icon={<Loader className="h-[18px] w-[18px]" />}
          accent="warning"
          loading={statsLoading}
          index={1}
        />
        <StatCard
          label="Tayyor"
          value={stats?.readyOrders ?? 0}
          icon={<PackageCheck className="h-[18px] w-[18px]" />}
          accent="success"
          loading={statsLoading}
          index={2}
        />
        <StatCard
          label="Oylik daromad"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          icon={<Wallet className="h-[18px] w-[18px]" />}
          accent="leather"
          loading={statsLoading}
          index={3}
        />
        <StatCard
          label="Jami mijozlar"
          value={stats?.totalCustomers ?? 0}
          icon={<Users className="h-[18px] w-[18px]" />}
          loading={statsLoading}
          index={4}
        />
      </div>

      {stats && stats.cancelledOrders > 0 && (
        <div className="mt-4">
          <StatCard
            label="Bekor qilinganlar (shu oy)"
            value={stats.cancelledOrders}
            icon={<XCircle className="h-[18px] w-[18px]" />}
            accent="destructive"
          />
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kunlik buyurtmalar (so'nggi 14 kun)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyOrders ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDateShort(d).slice(0, 5)}
                  fontSize={11}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d) => formatDateShort(d as string)}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#5B8DEF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xizmatlar bo'yicha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={(serviceStats ?? []).map((s) => ({
                    name: SERVICE_TYPE_LABELS[s.service_type as keyof typeof SERVICE_TYPE_LABELS] ?? s.service_type,
                    value: s.count,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={10}
                >
                  {(serviceStats ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-leather" /> TOP ishchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!topWorkers || topWorkers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Hozircha ma'lumot yo'q</p>
            ) : (
              <ul className="space-y-2">
                {topWorkers.map((w, idx) => (
                  <li
                    key={w.worker_id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{w.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {w.total_orders} buyurtma · {formatCurrency(w.total_earned)}
                        </p>
                      </div>
                    </div>
                    {w.total_reviews > 0 && (
                      <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" /> {w.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Mijozlar qoniqishi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="font-display text-4xl font-bold">
                  {satisfaction?.avg_rating ? satisfaction.avg_rating.toFixed(1) : "—"}
                </p>
                <div className="mt-1 flex justify-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(satisfaction?.avg_rating ?? 0) ? "fill-current" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {satisfaction?.total_reviews ?? 0} ta fikr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
