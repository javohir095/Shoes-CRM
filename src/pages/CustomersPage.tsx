import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Phone, Send, Package, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCustomers } from '@/hooks/useCustomers'
import { formatCurrency, formatDate, getInitials } from '@/lib/format'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useCustomers(debounced || undefined)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mijozlar</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `Jami ${data.length} ta mijoz` : 'Yuklanmoqda...'}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((customer, i) => (
            <motion.div
              key={customer.customer_phone}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(customer.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium leading-tight">{customer.customer_name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customer.customer_phone}
                    </p>
                  </div>
                  {customer.telegram_id && (
                    <Send className="ml-auto h-4 w-4 text-primary/60" />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{customer.order_count}</span>
                    <span className="text-xs text-muted-foreground">buyurtma</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5">
                    <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate font-medium">{formatCurrency(customer.total_spent)}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Oxirgi buyurtma: {formatDate(customer.last_order_at)}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Mijozlar topilmadi</p>
        </div>
      )}
    </div>
  )
}

export default CustomersPage
