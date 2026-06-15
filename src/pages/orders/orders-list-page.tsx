import * as React from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ClipboardList } from "lucide-react";
import { PageHeader, EmptyState } from "@/shared/ui/page-header";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useOrders } from "@/features/orders/hooks/use-orders";
import { OrderCard } from "@/widgets/orders/order-card";
import { ORDER_STATUS_CONFIG } from "@/shared/constants/orders";
import type { OrderStatus } from "@/types/database.types";

export default function OrdersListPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus | "all">("all");

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: orders, isLoading } = useOrders({
    search: debouncedSearch || undefined,
    status,
  });

  return (
    <div>
      <PageHeader
        title="Buyurtmalar"
        description="Barcha buyurtmalarni boshqarish va kuzatish"
        actions={
          <Link to="/orders/new">
            <Button>
              <Plus className="h-4 w-4" /> Yangi buyurtma
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buyurtma raqami, mijoz ismi yoki telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          className="sm:w-56"
        >
          <option value="all">Barcha statuslar</option>
          {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.emoji} {cfg.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-10 w-10" />}
          title="Buyurtmalar topilmadi"
          description="Hozircha bu mezonlarga mos buyurtma yo'q. Yangi buyurtma qo'shing yoki filtrlarni o'zgartiring."
          action={
            <Link to="/orders/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4" /> Yangi buyurtma qo'shish
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order, i) => (
            <OrderCard key={order.id} order={order} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
