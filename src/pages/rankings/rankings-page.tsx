import * as React from "react";
import { Trophy, Star, Wallet, CheckCircle2, Clock } from "lucide-react";
import { PageHeader, EmptyState } from "@/shared/ui/page-header";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useTopWorkers } from "@/features/reviews/api/reviews-api";
import { formatCurrency } from "@/shared/lib/utils";
import { cn } from "@/shared/lib/utils";

const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-orange-600"];

export default function RankingsPage() {
  const profile = useAuthStore((s) => s.profile);
  const isSuperAdmin = profile?.role === "super_admin";
  const { data: workers, isLoading } = useTopWorkers(profile?.company_id, isSuperAdmin);

  return (
    <div>
      <PageHeader title="Ishchilar reytingi" description="TOP 10 ishchi - buyurtmalar, daromad va mijoz baholari bo'yicha" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !workers || workers.length === 0 ? (
        <EmptyState icon={<Trophy className="h-10 w-10" />} title="Hozircha ma'lumot yo'q" />
      ) : (
        <div className="space-y-3">
          {workers.map((w, idx) => (
            <Card key={w.worker_id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-display text-lg font-bold",
                      idx < 3 && MEDAL_COLORS[idx]
                    )}
                  >
                    {idx < 3 ? <Trophy className="h-5 w-5" /> : idx + 1}
                  </span>
                  <div>
                    <p className="font-medium">{w.full_name}</p>
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(w.avg_rating) ? "fill-current" : "text-muted"}`} />
                      ))}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {w.avg_rating > 0 ? `${w.avg_rating.toFixed(1)} (${w.total_reviews})` : "Baholanmagan"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Buyurtmalar" value={w.total_orders} />
                  <Stat icon={<Clock className="h-4 w-4" />} label="O'z vaqtida" value={w.on_time_orders} />
                  <Stat icon={<Wallet className="h-4 w-4" />} label="Daromad" value={formatCurrency(w.total_earned)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="text-right">
      <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
