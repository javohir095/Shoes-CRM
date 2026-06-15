import * as React from "react";
import { motion } from "framer-motion";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

export function StatCard({
  label,
  value,
  icon,
  accent = "primary",
  loading,
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "primary" | "success" | "warning" | "leather" | "destructive";
  loading?: boolean;
  index?: number;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    leather: "bg-leather/10 text-leather",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accentClasses[accent])}>
            {icon}
          </div>
        </div>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">{value}</p>
        )}
      </Card>
    </motion.div>
  );
}
