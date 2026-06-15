import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar, CalendarDays, CalendarRange, CalendarClock } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/widgets/dashboard/stat-card";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useFinanceSummary } from "@/features/payments/api/finance-api";
import { formatCurrency } from "@/shared/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/shared/constants/orders";

export default function FinancePage() {
  const profile = useAuthStore((s) => s.profile);
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: summary, isLoading } = useFinanceSummary(profile?.company_id, isSuperAdmin);

  const chartData = summary
    ? Object.entries(summary.byMethod).map(([method, amount]) => ({
        method: PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method,
        amount,
      }))
    : [];

  return (
    <div>
      <PageHeader title="Moliya hisoboti" description="Tushum statistikasi va to'lov turlari" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Kunlik tushum" value={formatCurrency(summary?.daily ?? 0)} icon={<Calendar className="h-[18px] w-[18px]" />} loading={isLoading} index={0} />
        <StatCard label="Haftalik tushum" value={formatCurrency(summary?.weekly ?? 0)} icon={<CalendarDays className="h-[18px] w-[18px]" />} accent="leather" loading={isLoading} index={1} />
        <StatCard label="Oylik tushum" value={formatCurrency(summary?.monthly ?? 0)} icon={<CalendarRange className="h-[18px] w-[18px]" />} accent="success" loading={isLoading} index={2} />
        <StatCard label="Yillik tushum" value={formatCurrency(summary?.yearly ?? 0)} icon={<CalendarClock className="h-[18px] w-[18px]" />} accent="warning" loading={isLoading} index={3} />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>To'lov turlari bo'yicha tushum</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Ma'lumot yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="method" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="amount" fill="#5B8DEF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
