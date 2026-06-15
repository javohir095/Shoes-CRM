import * as React from "react";
import { Star, Wallet, TrendingUp, Users, Plus, KeyRound } from "lucide-react";
import { EmptyState } from "@/shared/ui/page-header";
import { Card } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar";
import { useCompanyUsers, useAllWorkerBalances } from "@/features/workers/hooks/use-workers";
import { updateWorkerPercentage, setUserActive } from "@/features/workers/api/workers-api";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/shared/lib/utils";
import { ROLE_LABELS } from "@/shared/constants/orders";
import { toast } from "sonner";
import { AddStaffDialog } from "@/features/auth/ui/add-staff-dialog";
import { ChangePasswordDialog } from "@/features/auth/ui/change-password-dialog";

interface StaffListProps {
  companyId: string | undefined;
  /** Whether to show the "Xodim qo'shish" action. Defaults to true. */
  showAddButton?: boolean;
}

export function StaffList({ companyId, showAddButton = true }: StaffListProps) {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useCompanyUsers(companyId);
  const { data: balances } = useAllWorkerBalances(companyId);

  const balanceMap = new Map((balances ?? []).map((b) => [b.worker_id, b]));

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [percentageDraft, setPercentageDraft] = React.useState("");
  const [addStaffOpen, setAddStaffOpen] = React.useState(false);
  const [passwordTarget, setPasswordTarget] = React.useState<{ id: string; name: string } | null>(null);

  const handleSavePercentage = async (userId: string) => {
    const value = Number(percentageDraft);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error("Foiz 0-100 oralig'ida bo'lishi kerak");
      return;
    }
    try {
      await updateWorkerPercentage(userId, value);
      queryClient.invalidateQueries({ queryKey: ["company-users", companyId] });
      toast.success("Foiz yangilandi");
      setEditingId(null);
    } catch {
      toast.error("Yangilashda xatolik");
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await setUserActive(userId, !isActive);
      queryClient.invalidateQueries({ queryKey: ["company-users", companyId] });
      toast.success(!isActive ? "Faollashtirildi" : "Bloklandi");
    } catch {
      toast.error("Yangilashda xatolik");
    }
  };

  const workers = (users ?? []).filter((u) => u.role !== "super_admin");

  return (
    <div>
      {showAddButton && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setAddStaffOpen(true)}>
            <Plus className="h-4 w-4" /> Xodim qo'shish
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Xodimlar topilmadi"
          action={
            showAddButton ? (
              <Button variant="outline" size="sm" onClick={() => setAddStaffOpen(true)}>
                <Plus className="h-4 w-4" /> Xodim qo'shish
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {workers.map((user) => {
            const balance = balanceMap.get(user.id);
            return (
              <Card key={user.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.full_name} src={user.avatar_url} />
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[user.role]}
                        {user.login && ` · @${user.login}`}
                        {user.phone && ` · ${user.phone}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {user.role === "worker" && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          {editingId === user.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                className="h-8 w-16 px-2"
                                value={percentageDraft}
                                onChange={(e) => setPercentageDraft(e.target.value)}
                                autoFocus
                              />
                              <span>%</span>
                              <Button size="sm" className="h-8" onClick={() => handleSavePercentage(user.id)}>
                                OK
                              </Button>
                            </div>
                          ) : (
                            <button
                              className="font-medium underline-offset-2 hover:underline"
                              onClick={() => {
                                setEditingId(user.id);
                                setPercentageDraft(String(user.percentage));
                              }}
                            >
                              {user.percentage}% ulush
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatCurrency(balance?.current_balance ?? 0)}</span>
                        </div>

                        {balance && balance.total_reviews > 0 && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-medium">{balance.avg_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPasswordTarget({ id: user.id, name: user.full_name })}
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Parol
                    </Button>

                    <Button
                      size="sm"
                      variant={user.is_active ? "outline" : "secondary"}
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    >
                      {user.is_active ? "Faol" : "Bloklangan"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddStaffDialog open={addStaffOpen} onClose={() => setAddStaffOpen(false)} companyId={companyId} />

      {passwordTarget && (
        <ChangePasswordDialog
          open={!!passwordTarget}
          onClose={() => setPasswordTarget(null)}
          userId={passwordTarget.id}
          userName={passwordTarget.name}
        />
      )}
    </div>
  );
}
