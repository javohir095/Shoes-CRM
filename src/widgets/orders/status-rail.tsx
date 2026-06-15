import { ORDER_STATUS_CONFIG, ORDER_STATUS_FLOW } from "@/shared/constants/orders";
import type { OrderStatus } from "@/types/database.types";
import { cn } from "@/shared/lib/utils";
import { Check, X } from "lucide-react";

/**
 * Signature element: a horizontal "workshop rail" showing the shoe's
 * journey from intake to handover, mirroring its physical path through
 * the workshop stations.
 */
export function StatusRail({ status }: { status: OrderStatus }) {
  if (status === "bekor_qilindi") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
        <X className="h-4 w-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Buyurtma bekor qilindi</span>
      </div>
    );
  }

  const effectiveStatus = status === "tugallangan" ? "topshirildi" : status;
  const currentIdx = ORDER_STATUS_FLOW.indexOf(effectiveStatus);

  return (
    <div className="flex items-center overflow-x-auto pb-2 scrollbar-none">
      {ORDER_STATUS_FLOW.map((step, idx) => {
        const config = ORDER_STATUS_CONFIG[step];
        const isDone = idx < currentIdx || status === "tugallangan";
        const isCurrent = idx === currentIdx && status !== "tugallangan";
        const isLast = idx === ORDER_STATUS_FLOW.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isDone && "border-success bg-success text-success-foreground",
                  isCurrent && `border-2 ${config.dot.replace("bg-", "border-")} ${config.bg} ${config.color}`,
                  !isDone && !isCurrent && "border-border bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : config.emoji}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium text-center leading-tight",
                  isCurrent ? config.color : isDone ? "text-success" : "text-muted-foreground"
                )}
              >
                {config.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 w-8 sm:w-12 -mt-5 transition-colors",
                  isDone ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
