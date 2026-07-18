import { useState } from 'react'
import { motion } from 'framer-motion'
import { format, addMonths, startOfMonth } from 'date-fns'
import { Check, CreditCard, Loader2, Plus, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useSubscriptions, useCreateSubscription, useMarkSubscriptionPaid } from '@/hooks/useSubscriptions'
import { useAllCompanies } from '@/hooks/useCompanies'
import { formatCurrency, formatDate } from '@/lib/format'
import { SUBSCRIPTION_STATUS_LABELS } from '@/types/database'
import type { SubscriptionStatus } from '@/types/database'

const STATUS_BADGE: Record<SubscriptionStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'secondary',
}

export function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions()
  const { data: companies } = useAllCompanies()
  const createSub = useCreateSubscription()
  const markPaid = useMarkSubscriptionPaid()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all')

  const filtered = (data ?? []).filter(
    (s) => statusFilter === 'all' || s.status === statusFilter
  )

  const stats = {
    total: (data ?? []).length,
    paid: (data ?? []).filter((s) => s.status === 'paid').length,
    pending: (data ?? []).filter((s) => s.status === 'pending' || s.status === 'overdue').length,
    monthlyRevenue: (data ?? []).filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.amount, 0),
  }

  const handleCreate = () => {
    if (!selectedCompany) return
    const company = (companies ?? []).find((c) => c.id === selectedCompany)
    const amount = Number(customAmount) || company?.monthly_fee || 500000
    const periodStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const periodEnd = format(startOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd')

    createSub.mutate(
      { company_id: selectedCompany, period_start: periodStart, period_end: periodEnd, amount },
      { onSuccess: () => { setCreateOpen(false); setSelectedCompany(''); setCustomAmount('') } }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Obunalar</h1>
          <p className="text-sm text-muted-foreground">Kompaniya obuna to'lovlari</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Obuna qo'shish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Jami', value: stats.total, icon: CreditCard },
          { label: "To'langan", value: stats.paid, icon: Check },
          { label: 'Kutilmoqda', value: stats.pending, icon: Clock },
          { label: 'Oylik daromad', value: formatCurrency(stats.monthlyRevenue), icon: AlertTriangle },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SubscriptionStatus | 'all')}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Barcha statuslar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha statuslar</SelectItem>
          {(['pending', 'paid', 'overdue', 'cancelled'] as SubscriptionStatus[]).map((s) => (
            <SelectItem key={s} value={s}>{SUBSCRIPTION_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((sub, i) => (
            <motion.div key={sub.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{sub.company?.name ?? 'Noma\'lum kompaniya'}</p>
                      <Badge variant={STATUS_BADGE[sub.status]}>
                        {SUBSCRIPTION_STATUS_LABELS[sub.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(sub.period_start)} — {formatDate(sub.period_end)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold">{formatCurrency(sub.amount)}</p>
                    {(sub.status === 'pending' || sub.status === 'overdue') && (
                      <Button size="sm" onClick={() => markPaid.mutate(sub.id)} disabled={markPaid.isPending}>
                        {markPaid.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        To'landi
                      </Button>
                    )}
                    {sub.status === 'paid' && sub.paid_at && (
                      <p className="text-xs text-muted-foreground">{formatDate(sub.paid_at)}</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
          <CreditCard className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Obunalar topilmadi</p>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Yangi obuna</DialogTitle>
            <DialogDescription>Kompaniya uchun oylik obuna yaratish</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Kompaniya</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Kompaniyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {(companies ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Miqdor (so'm) — bo'sh qolsa kompaniya narxi ishlatiladi</Label>
              <Input type="number" step="10000" placeholder="500000" value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
            <Button disabled={!selectedCompany || createSub.isPending} onClick={handleCreate}>
              {createSub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubscriptionsPage
