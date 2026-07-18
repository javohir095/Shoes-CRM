import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ServiceBreakdownPoint } from '@/types'

interface TopServicesChartProps {
  data: ServiceBreakdownPoint[]
  loading?: boolean
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(160 70% 45%)',
  'hsl(38 92% 55%)',
  'hsl(280 65% 60%)',
  'hsl(200 80% 55%)',
]

export function TopServicesChart({ data, loading }: TopServicesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eng ko'p xizmatlar</CardTitle>
        <CardDescription>Xizmat turlari bo'yicha buyurtmalar soni</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Ma'lumot yo'q
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="service_type"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                }}
                formatter={(value: number) => [`${value} ta`, 'Buyurtmalar']}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
