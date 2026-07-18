import { Fragment, useState } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth } from 'date-fns'
import { Loader2, Plus, Wallet, ChevronDown, ChevronUp, CreditCard, Lock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  useSalaries, useSalaryPayments, useUpsertSalary, useCreateSalaryPayment,
  useOwnSalaries, useOwnSalaryPayments, useConfirmSalaryPayment,
} from '@/hooks/useSalaries'
import { useCompanyUsers } from '@/hooks/useWorkers'
import { useAuth } from '@/hooks/useAuth'
import { signInWithPassword } from '@/services/auth.service'
import { formatCurrency, formatDateTime, getInitials } from '@/lib/format'
import { ROLE_LABELS, SALARY_PAYMENT_STATUS_LABELS } from '@/types/database'
import type { EmployeeSalary, SalaryPayment, User } from '@/types/database'

const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM-dd')

export function SalariesPage() {
  const { isWorker, isAdmin } = useAuth()
  if (isWorker && !isAdmin) return <WorkerSalaryView />
  return <ManagerSalaryView />
}

function ManagerSalaryView() {
  const [periodMonth, setPeriodMonth] = useState(currentMonthKey)
  const { data: salaries, isLoading } = useSalaries(periodMonth)
  const { data: employees } = useCompanyUsers()
  const upsertSalary = useUpsertSalary()

  const [selectedSalary, setSelectedSalary] = useState<EmployeeSalary | null>(null)
  const [setSalaryTarget, setSetSalaryTarget] = useState<User | null>(null)
  const [salaryInput, setSalaryInput] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')

  // Aggregate stats
  const totalSalary = (salaries ?? []).reduce((s, r) => s + r.salary_amount, 0)
  const totalPaid = (salaries ?? []).reduce((s, r) => s + r.paid_amount, 0)
  const totalRemaining = (salaries ?? []).reduce((s, r) => s + r.remaining_amount, 0)

  // employees without salary record
  const salaryEmployeeIds = new Set((salaries ?? []).map((s) => s.employee_id))
  const employeesWithoutSalary = (employees ?? []).filter(
    (e) => !salaryEmployeeIds.has(e.id) && e.role !== 'super_admin'
  )

  const createPayment = useCreateSalaryPayment(selectedSalary?.id ?? '')

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Maosh boshqaruvi</h1>
          <p className="text-sm text-muted-foreground">Xodimlar maosh va to'lovlarini boshqarish</p>
        </div>
        <Input
          type="month"
          value={periodMonth.slice(0, 7)}
          onChange={(e) => setPeriodMonth(e.target.value + '-01')}
          className="w-auto"
        />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Jami maosh', value: totalSalary, color: 'primary' },
          { label: "To'langan", value: totalPaid, color: 'success' },
          { label: 'Qoldiq', value: totalRemaining, color: 'warning' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(s.value)}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Employees with salary records */}
          {(salaries ?? []).map((salary, i) => (
            <motion.div key={salary.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(salary.employee?.fullname ?? '?')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{salary.employee?.fullname}</p>
                      <p className="text-xs text-muted-foreground">
                        {salary.employee?.role ? ROLE_LABELS[salary.employee.role] : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(salary.salary_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Qoldiq: <span className={salary.remaining_amount > 0 ? 'text-destructive' : 'text-success'}>
                          {formatCurrency(salary.remaining_amount)}
                        </span>
                      </p>
                    </div>
                    <Button size="sm" onClick={() => {
                      setSelectedSalary(salary)
                      setPaymentOpen(true)
                      setPayAmount('')
                      setPayNote('')
                    }}>
                      <CreditCard className="h-4 w-4" />
                      To'lov
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={() =>
                      setSelectedSalary(s => s?.id === salary.id ? null : salary)
                    }>
                      {selectedSalary?.id === salary.id && !paymentOpen
                        ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (salary.paid_amount / salary.salary_amount) * 100)}%` }}
                  />
                </div>

                {/* Payment history */}
                {selectedSalary?.id === salary.id && !paymentOpen && (
                  <SalaryPaymentHistory salaryId={salary.id} />
                )}
              </Card>
            </motion.div>
          ))}

          {/* Employees without salary — assign salary */}
          {employeesWithoutSalary.map((emp) => (
            <Card key={emp.id} className="p-4 border-dashed">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-sm">{getInitials(emp.fullname)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{emp.fullname}</p>
                    <Badge variant="outline">{ROLE_LABELS[emp.role]}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSetSalaryTarget(emp); setSalaryInput('') }}>
                  <Plus className="h-4 w-4" />
                  Maosh belgilash
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Set salary dialog */}
      <Dialog open={!!setSalaryTarget} onOpenChange={(o) => !o && setSetSalaryTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Maosh belgilash</DialogTitle>
            <DialogDescription>{setSalaryTarget?.fullname} uchun oylik maosh</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Maosh miqdori (so'm)</Label>
            <Input type="number" step="10000" placeholder="2000000" value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetSalaryTarget(null)}>Bekor</Button>
            <Button disabled={!salaryInput || upsertSalary.isPending} onClick={() => {
              upsertSalary.mutate(
                { employee_id: setSalaryTarget!.id, salary_amount: Number(salaryInput), period_month: periodMonth },
                { onSuccess: () => setSetSalaryTarget(null) }
              )
            }}>
              {upsertSalary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Maosh to'lovi</DialogTitle>
            <DialogDescription>
              {selectedSalary?.employee?.fullname} — Qoldiq:{' '}
              {selectedSalary ? formatCurrency(selectedSalary.remaining_amount) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Miqdor (so'm)</Label>
              <Input type="number" step="10000" placeholder="500000" value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Izoh (ixtiyoriy)</Label>
              <Input placeholder="Avans to'lovi..." value={payNote} onChange={(e) => setPayNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Bekor</Button>
            <Button disabled={!payAmount || createPayment.isPending} onClick={() => {
              createPayment.mutate({ amount: Number(payAmount), note: payNote || undefined }, {
                onSuccess: () => setPaymentOpen(false),
              })
            }}>
              {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              To'lash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SalaryPaymentHistory({ salaryId }: { salaryId: string }) {
  const { data, isLoading } = useSalaryPayments(salaryId)

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">To'lovlar tarixi</p>
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{formatCurrency(p.amount)}</p>
                {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <PaymentStatusBadge status={p.status} />
                <p className="text-xs text-muted-foreground">{formatDateTime(p.paid_at)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 text-xs text-muted-foreground">To'lovlar yo'q</p>
      )}
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: SalaryPayment['status'] }) {
  return (
    <Badge variant={status === 'tasdiqlangan' ? 'success' : 'outline'}>
      {SALARY_PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

function WorkerSalaryView() {
  const { session } = useAuth()
  const { data: salaries, isLoading: salariesLoading } = useOwnSalaries()
  const { data: payments, isLoading: paymentsLoading } = useOwnSalaryPayments()
  const confirmPayment = useConfirmSalaryPayment()

  const [confirmTarget, setConfirmTarget] = useState<SalaryPayment | null>(null)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)

  const handleConfirm = async () => {
    if (!confirmTarget || !session?.email) return
    setVerifying(true)
    try {
      await signInWithPassword(session.email, password)
    } catch {
      toast.error("Parol noto'g'ri")
      setVerifying(false)
      return
    }
    confirmPayment.mutate(confirmTarget.id, {
      onSuccess: () => {
        setConfirmTarget(null)
        setPassword('')
      },
      onSettled: () => setVerifying(false),
    })
  }

  const isLoading = salariesLoading || paymentsLoading

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mening oyliklarim</h1>
        <p className="text-sm text-muted-foreground">Maosh va to'lovlar tarixi</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {(salaries ?? []).slice(0, 1).map((s) => (
              <Fragment key={s.id}>
                <Card key={`amount-${s.id}`} className="p-4">
                  <p className="text-xs text-muted-foreground">Joriy oy maoshi</p>
                  <p className="mt-1 text-xl font-bold">{formatCurrency(s.salary_amount)}</p>
                </Card>
                <Card key={`paid-${s.id}`} className="p-4">
                  <p className="text-xs text-muted-foreground">To'langan</p>
                  <p className="mt-1 text-xl font-bold text-success">{formatCurrency(s.paid_amount)}</p>
                </Card>
                <Card key={`remaining-${s.id}`} className="p-4">
                  <p className="text-xs text-muted-foreground">Qoldiq</p>
                  <p className="mt-1 text-xl font-bold">{formatCurrency(s.remaining_amount)}</p>
                </Card>
              </Fragment>
            ))}
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">To'lovlar tarixi</h2>
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between gap-3 border-b pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(p.paid_at)}</p>
                      {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <PaymentStatusBadge status={p.status} />
                      {p.status === 'kutilmoqda' && (
                        <Button size="sm" onClick={() => { setConfirmTarget(p); setPassword('') }}>
                          <CheckCircle2 className="h-4 w-4" />
                          Tasdiqlash
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">To'lovlar hali mavjud emas</p>
            )}
          </Card>
        </>
      )}

      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>To'lovni tasdiqlash</DialogTitle>
            <DialogDescription>
              {confirmTarget && formatCurrency(confirmTarget.amount)} miqdoridagi to'lovni qabul
              qilganingizni tasdiqlash uchun parolingizni kiriting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Parol</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>Bekor</Button>
            <Button disabled={!password || verifying} onClick={handleConfirm}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SalariesPage
