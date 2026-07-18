import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Phone, Calendar, Footprints } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Order } from '@/types/database'

interface OrderCardProps {
  order: Order
  index?: number
}

export function OrderCard({ order, index = 0 }: OrderCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card
        onClick={() => navigate(`/orders/${order.id}`)}
        className="group cursor-pointer p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Footprints className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">{order.order_number}</p>
              <p className="font-medium leading-tight">{order.customer_name}</p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            {order.customer_phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(order.created_at)}
          </span>
          <span className="ml-auto font-semibold text-foreground">{formatCurrency(order.price)}</span>
        </div>
      </Card>
    </motion.div>
  )
}
