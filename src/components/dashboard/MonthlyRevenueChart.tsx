import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format'
import type { MonthlyRevenuePoint } from '@/types'

interface MonthlyRevenueChartProps {
  data: MonthlyRevenuePoint[]
  loading?: boolean
}

export function MonthlyRevenueChart({ data, loading }: MonthlyRevenueChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Intl.DateTimeFormat('uz-UZ', { month: 'short' }).format(new Date(d.month)),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oylik daromad</CardTitle>
        <CardDescription>Oxirgi 6 oylik daromad dinamikasi</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={formatted} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatCurrency(value), 'Daromad']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
