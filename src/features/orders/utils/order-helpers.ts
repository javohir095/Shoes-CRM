import { ORDER_STATUS_FLOW } from "@/shared/constants/orders";
import type { OrderStatus } from "@/types/database.types";

/** Returns the next status in the standard workflow, or null if it's terminal/cancelled. */
export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}

/** Progress percentage (0-100) along the standard journey, for the status rail. */
export function getStatusProgress(current: OrderStatus): number {
  if (current === "bekor_qilindi") return 0;
  if (current === "tugallangan") return 100;
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx === -1) return 0;
  return Math.round((idx / (ORDER_STATUS_FLOW.length - 1)) * 100);
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === "topshirildi" || status === "tugallangan" || status === "bekor_qilindi";
}
