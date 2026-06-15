import * as React from "react";
import { BadgeDollarSign, Wallet, TrendingUp, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/shared/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Dialog } from "@/shared/ui/dialog";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useWorkerBalance, useWorkers, useAllWorkerBalances } from "@/features/workers/hooks/use-workers";
import {
  useSalaryPayments,
  useCompanySalaryPayments,
  useCreateSalaryPayment,
  useConfirmSalaryPayment,
} from "@/features/payments/api/salary-api";
import { formatCurrency, formatDate } from "@/shared/lib/utils";

export default function SalaryPage() {
  const profile = useAuthStore((s) => s.profile);

  if (profile?.role === "worker") {
    return <WorkerSalaryView />;
  }
  return <AdminSalaryView />;
}

function WorkerSalaryView() {
  const profile = useAuthStore((s) => s.profile);
  const { data: balance, isLoading } = useWorkerBalance(profile?.id);
  const { data: payments } = useSalaryPayments(profile?.id);
  const confirmPayment = useConfirmSalaryPayment();

  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");

  const pendingPayments = (payments ?? []).filter((p) => p.status === "pending");

  const handleConfirm = (paymentId: string) => {
    // Password verification is illustrative; real check should happen server-side.
    if (!password) return;
    confirmPayment.mutate(paymentId, {
      onSuccess: () => {
        setConfirmingId(null);
        setPassword("");
      },
    });
  };

  return (
    <div>
      <PageHeader title="Mening balansim" description="Daromad va to'lovlar tarixi" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Joriy balans</p>
            <p className="mt-2 font-display text-2xl font-semibold">{formatCurrency(balance?.current_balance ?? 0)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Jami ishlangan pul</p>
            <p className="mt-2 font-display text-2xl font-semibold">{formatCurrency(balance?.total_earned ?? 0)}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">To'langan jami</p>
            <p className="mt-2 font-display text-2xl font-semibold">{formatCurrency(balance?.total_paid ?? 0)}</p>
          </Card>
        </div>
      )}

      {pendingPayments.length > 0 && (
        <Card className="mt-5 border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" /> Tasdiqlanishi kutilayotgan to'lovlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <div>
                  <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                </div>
                <Button size="sm" onClick={() => setConfirmingId(p.id)}>
                  Tasdiqlash
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Oylik to'lovlar tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <EmptyState icon={<BadgeDollarSign className="h-10 w-10" />} title="To'lovlar tarixi bo'sh" />
          ) : (
            <ul className="space-y-2">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                  <div className="flex items-center gap-2">
                    {p.status === "confirmed" ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 text-warning" />
                    )}
                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {p.status === "confirmed" && p.confirmed_at ? formatDate(p.confirmed_at) : formatDate(p.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmingId} onClose={() => setConfirmingId(null)} title="To'lovni tasdiqlash">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To'lovni tasdiqlash uchun parolingizni kiriting. Tasdiqlangandan keyin summa balansingizdan ayriladi.
          </p>
          <div>
            <Label htmlFor="confirm-password">Parol</Label>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmingId(null)}>
              Bekor qilish
            </Button>
            <Button
              size="sm"
              variant="success"
              disabled={!password || confirmPayment.isPending}
              onClick={() => confirmingId && handleConfirm(confirmingId)}
            >
              {confirmPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Tasdiqlash
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function AdminSalaryView() {
  const profile = useAuthStore((s) => s.profile);
  const { data: workers } = useWorkers(profile?.company_id ?? undefined);
  const { data: balances, isLoading } = useAllWorkerBalances(profile?.company_id ?? undefined);
  const { data: payments } = useCompanySalaryPayments(profile?.company_id ?? undefined);
  const createPayment = useCreateSalaryPayment();

  const [payingWorkerId, setPayingWorkerId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");

  const balanceMap = new Map((balances ?? []).map((b) => [b.worker_id, b]));
  const paidMap = new Map<string, number>();
  for (const p of payments ?? []) {
    if (p.status === "confirmed") {
      paidMap.set(p.worker_id, (paidMap.get(p.worker_id) ?? 0) + Number(p.amount));
    }
  }

  const handlePay = () => {
    if (!profile?.company_id || !payingWorkerId) return;
    const value = Number(amount);
    if (Number.isNaN(value) || value <= 0) return;

    createPayment.mutate(
      {
        company_id: profile.company_id,
        worker_id: payingWorkerId,
        amount: value,
        paid_by: profile.id,
      },
      {
        onSuccess: () => {
          setPayingWorkerId(null);
          setAmount("");
        },
      }
    );
  };

  return (
    <div>
      <PageHeader title="Oyliklar" description="Ishchilar balansi va oylik to'lovlarini boshqarish" />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !workers || workers.length === 0 ? (
        <EmptyState icon={<Wallet className="h-10 w-10" />} title="Ishchilar topilmadi" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ishchi</th>
                  <th className="px-4 py-3">Balans</th>
                  <th className="px-4 py-3">To'langan</th>
                  <th className="px-4 py-3">Qoldiq</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => {
                  const balance = balanceMap.get(w.id);
                  const current = balance?.current_balance ?? 0;
                  const totalPaid = balance?.total_paid ?? 0;
                  return (
                    <tr key={w.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium">{w.full_name}</td>
                      <td className="px-4 py-3">{formatCurrency(current)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatCurrency(totalPaid)}</td>
                      <td className="px-4 py-3 font-semibold text-warning">{formatCurrency(current)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={current <= 0}
                          onClick={() => {
                            setPayingWorkerId(w.id);
                            setAmount(String(current));
                          }}
                        >
                          <TrendingUp className="h-3.5 w-3.5" /> Oylik to'lash
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!payingWorkerId} onClose={() => setPayingWorkerId(null)} title="Oylik to'lash">
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Summa (so'm)</Label>
            <Input id="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            To'lov yaratilgandan so'ng ishchi profilida tasdiqlash uchun ko'rinadi. Tasdiqlangandan
            keyin balansdan ushbu summa ayriladi.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPayingWorkerId(null)}>
              Bekor qilish
            </Button>
            <Button size="sm" onClick={handlePay} disabled={createPayment.isPending}>
              {createPayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              To'lashni tasdiqlash
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
