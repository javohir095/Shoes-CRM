import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, X, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderCard } from '@/components/orders/OrderCard'
import { OrderFormDialog } from '@/components/orders/OrderFormDialog'
import { useOrders } from '@/hooks/useOrders'
import { useWorkers } from '@/hooks/useWorkers'
import { useAuth } from '@/hooks/useAuth'
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from '@/types/database'
import type { OrderFilters } from '@/types'

const PAGE_SIZE = 12

export function OrdersPage() {
  const { isSuperAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [workerId, setWorkerId] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  const { data: workers } = useWorkers()

  useEffect(() => {
    if (searchParams.get('new') === '1' && !isSuperAdmin) {
      setCreateOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, isSuperAdmin])

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const filters: OrderFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status,
      workerId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [debouncedSearch, status, workerId, dateFrom, dateTo]
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, workerId, dateFrom, dateTo])

  const { data, isLoading, isFetching } = useOrders(filters, page, PAGE_SIZE)

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const hasActiveFilters = !!(debouncedSearch || status !== 'all' || workerId !== 'all' || dateFrom || dateTo)

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
    setWorkerId('all')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buyurtmalar</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `Jami ${data.total} ta buyurtma` : 'Yuklanmoqda...'}
          </p>
        </div>
        {!isSuperAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Yangi buyurtma
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl border p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buyurtma raqami, ism yoki telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha statuslar</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger>
              <SelectValue placeholder="Ishchi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha ishchilar</SelectItem>
              {(workers ?? []).map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.fullname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="min-w-0"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="min-w-0"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Filtrlarni tozalash
            </Button>
          </div>
        )}
      </div>

      {/* Orders grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : data && data.orders.length > 0 ? (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.15s' }}
        >
          {data.orders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <PackageSearch className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Buyurtmalar topilmadi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters ? "Filtrlarni o'zgartirib ko'ring" : "Birinchi buyurtmangizni yarating"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <OrderFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

export default OrdersPage
