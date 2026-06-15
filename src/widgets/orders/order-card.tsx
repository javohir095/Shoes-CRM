import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Wallet } from "lucide-react";
import type { Order } from "@/types/database.types";
import { StatusBadge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { formatCurrency, formatDate } from "@/shared/lib/utils";
import { SERVICE_TYPE_LABELS } from "@/shared/constants/orders";

export function OrderCard({ order, index = 0 }: { order: Order; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link to={`/orders/${order.id}`}>
        <Card className="group p-4 transition-all hover:border-primary/40 hover:shadow-glass">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-primary">{order.order_number}</p>
              <p className="mt-1 font-display text-base font-semibold">{order.customer_name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" /> {order.customer_phone}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <div>
              <p className="text-muted-foreground">
                {order.shoe_type}
                {order.brand ? ` · ${order.brand}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">{SERVICE_TYPE_LABELS[order.service_type]}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 font-semibold">
                <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                {formatCurrency(order.price)}
              </p>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
