import * as React from "react";
import { Search, Users, MessageCircle } from "lucide-react";
import { PageHeader, EmptyState } from "@/shared/ui/page-header";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useCustomers } from "@/features/customers/api/customers-api";
import { formatCurrency, formatDate } from "@/shared/lib/utils";

export default function CustomersPage() {
  const profile = useAuthStore((s) => s.profile);
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: customers, isLoading } = useCustomers(profile?.company_id, isSuperAdmin);
  const [search, setSearch] = React.useState("");

  const filtered = (customers ?? []).filter((c) => {
    const term = search.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.phone.includes(term);
  });

  return (
    <div>
      <PageHeader title="Mijozlar" description="Barcha mijozlar va ularning buyurtmalari" />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ism yoki telefon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title="Mijozlar topilmadi" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ism</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">Buyurtmalar</th>
                  <th className="px-4 py-3">Jami xarid</th>
                  <th className="px-4 py-3">So'nggi buyurtma</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.phone} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        {c.phone}
                        {c.telegramId && <MessageCircle className="h-3.5 w-3.5 text-primary" />}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.orderCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(c.totalSpent)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(c.lastOrderAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
