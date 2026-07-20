import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Loader2, MoreVertical, Plus, Search, Trash2, UserCog, Users,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAllUsers, useUpdateWorker, useDeleteWorker } from '@/hooks/useWorkers'
import { useAuth } from '@/hooks/useAuth'
import { useBranchesForCompany } from '@/hooks/useBranches'
import { useAllCompanies } from '@/hooks/useCompanies'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getInitials } from '@/lib/format'
import { ROLE_LABELS } from '@/types/database'
import type { User, UserRole } from '@/types/database'

const PAGE_SIZE = 20

const createSchema = z.object({
  company_id: z.string().min(1, 'Kompaniyani tanlang'),
  fullname: z.string().min(2, "Ism kamida 2 belgidan iborat bo'lsin"),
  phone: z.string().min(9, "Telefon raqami noto'g'ri"),
  login: z.string()
    .min(3, "Login kamida 3 belgidan iborat bo'lsin")
    .regex(/^[a-z0-9_.]+$/i, "Login faqat harf, raqam, _ va . belgilaridan iborat bo'lsin"),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lsin"),
  role: z.enum(['worker', 'admin', 'director']),
  branch_id: z.string().optional(),
})
type CreateValues = z.infer<typeof createSchema>

const ROLE_BADGE: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  super_admin: 'default',
  director: 'default',
  admin: 'secondary',
  worker: 'outline',
}

export function WorkersPage() {
  const { isSuperAdmin, isAdmin, role, companyId } = useAuth()
  const creatableRoles: { value: CreateValues['role']; label: string }[] = isSuperAdmin
    ? [
        { value: 'worker', label: 'Ishchi' },
        { value: 'admin', label: 'Admin' },
        { value: 'director', label: 'Direktor' },
      ]
    : role === 'director'
      ? [
          { value: 'worker', label: 'Ishchi' },
          { value: 'admin', label: 'Admin' },
        ]
      : [{ value: 'worker', label: 'Ishchi' }]
  const updateWorker = useUpdateWorker()
  const deleteWorker = useDeleteWorker()
  const { data: companies } = useAllCompanies()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { setPage(1) }, [roleFilter])

  const { data, isLoading } = useAllUsers({
    search: debouncedSearch || undefined,
    role: roleFilter,
    page,
    pageSize: PAGE_SIZE,
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { company_id: companyId ?? '', fullname: '', phone: '', login: '', password: '', role: 'worker' },
  })
  const roleValue = watch('role')
  const selectedCompanyId = watch('company_id')
  const { data: branches } = useBranchesForCompany(selectedCompanyId || undefined)

  const onCreateSubmit = async (values: CreateValues) => {
    setIsCreating(true)
    try {
      // Creating a login-only account (no real email) has to go through a
      // service-role Edge Function: Supabase's public signUp() validates
      // the derived pseudo-email's domain and rejects it outright, while
      // auth.admin.createUser() (server-side only) does not.
      const { data, error } = await supabase.functions.invoke('create-staff', {
        body: {
          login: values.login,
          password: values.password,
          fullname: values.fullname,
          phone: values.phone,
          role: values.role,
          branch_id: values.branch_id || null,
          company_id: values.company_id,
        },
      })
      if (error) {
        const message = (await error.context?.json?.().catch(() => null))?.error
        throw new Error(message || error.message)
      }
      if (data?.error) throw new Error(data.error)

      toast.success(`${values.fullname} qo'shildi`)
      setCreateOpen(false)
      reset({ company_id: companyId ?? '', fullname: '', phone: '', login: '', password: '', role: 'worker' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xodim qo'shishda xatolik")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Xodimlar</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `Jami ${data.total} ta xodim` : 'Yuklanmoqda...'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Xodim qo'shish
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Ism yoki telefon bo'yicha qidirish..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Barcha rollar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha rollar</SelectItem>
            {(['worker', 'admin', 'director', 'super_admin'] as UserRole[]).map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : data && data.users.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.users.map((user, i) => (
              <motion.div key={user.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.fullname)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-tight">{user.fullname}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                        {isSuperAdmin && user.company && (
                          <p className="text-xs text-muted-foreground">{user.company.name}</p>
                        )}
                      </div>
                    </div>
                    {(isSuperAdmin || (isAdmin && user.role !== 'super_admin' && user.role !== 'director')) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.role !== 'super_admin' && (
                            <>
                              <DropdownMenuItem onClick={() =>
                                updateWorker.mutate({ userId: user.id, values: { role: 'admin' } })
                              }>
                                <UserCog className="h-4 w-4" />Admin qilish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() =>
                                updateWorker.mutate({ userId: user.id, values: { role: 'worker' } })
                              }>
                                <Users className="h-4 w-4" />Ishchi qilish
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(user)}>
                            <Trash2 className="h-4 w-4" />O'chirish
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant={ROLE_BADGE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                    {user.branch && <Badge variant="outline">{user.branch.name}</Badge>}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {data.total > PAGE_SIZE && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Xodimlar topilmadi</p>
          {debouncedSearch && <p className="mt-1 text-sm text-muted-foreground">Boshqa kalit so'z sinab ko'ring</p>}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi xodim qo'shish</DialogTitle>
            <DialogDescription>Xodim uchun hisob yaratiladi</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label>Kompaniya</Label>
                <Select value={selectedCompanyId} onValueChange={(v) => {
                  setValue('company_id', v)
                  setValue('branch_id', undefined)
                }}>
                  <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                  <SelectContent>
                    {(companies ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.company_id && <p className="text-xs text-destructive">{errors.company_id.message}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>To'liq ism</Label>
              <Input placeholder="Aziz Karimov" {...register('fullname')} />
              {errors.fullname && <p className="text-xs text-destructive">{errors.fullname.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefon raqami</Label>
              <Input placeholder="+998 90 123 45 67" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Login</Label>
              <Input
                type="text"
                placeholder="sardor"
                autoComplete="username"
                autoCapitalize="none"
                {...register('login')}
              />
              {errors.login && <p className="text-xs text-destructive">{errors.login.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Parol</Label>
              <Input type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={roleValue} onValueChange={(v) => setValue('role', v as CreateValues['role'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {creatableRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Filial (ixtiyoriy)</Label>
                <Select value={watch('branch_id')} onValueChange={(v) => setValue('branch_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Filialsiz (kompaniya darajasida)" /></SelectTrigger>
                  <SelectContent>
                    {(branches ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Qo'shish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xodimni o'chirish</DialogTitle>
            <DialogDescription>
              {deleteTarget?.fullname} ni xodimlar ro'yxatidan o'chirishni tasdiqlaysizmi?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Bekor</Button>
            <Button variant="destructive" disabled={deleteWorker.isPending}
              onClick={() => deleteWorker.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}>
              {deleteWorker.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WorkersPage
