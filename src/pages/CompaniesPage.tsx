import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  Building2, Loader2, MoreVertical, Phone, Plus, Search, Trash2, Bot, Edit2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAllCompanies, useCreateCompany, useDeleteCompany, useUpdateCompanyAdmin } from '@/hooks/useCompanies'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Company } from '@/types/database'

const schema = z.object({
  name: z.string().min(2, 'Kompaniya nomini kiriting'),
  phone: z.string().min(9, 'Telefon raqamini kiriting'),
  monthly_fee: z.coerce.number().min(0, 'Oylik to\'lov miqdori kiriting'),
  bot_token: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function CompaniesPage() {
  const { data, isLoading } = useAllCompanies()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompanyAdmin()
  const deleteCompany = useDeleteCompany()

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Company | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)

  const filtered = (data ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monthly_fee: 500000 },
  })

  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: FormValues) => {
    createCompany.mutate(values, {
      onSuccess: () => { setCreateOpen(false); reset() },
    })
  }

  const onEdit = (values: FormValues) => {
    if (!editTarget) return
    updateCompany.mutate({ id: editTarget.id, values }, {
      onSuccess: () => setEditTarget(null),
    })
  }

  const openEdit = (c: Company) => {
    editForm.reset({ name: c.name, phone: c.phone, monthly_fee: c.monthly_fee, bot_token: c.bot_token ?? '' })
    setEditTarget(c)
  }

  // Stats
  const totalCompanies = filtered.length
  const monthlyTotal = (data ?? []).reduce((s, c) => s + c.monthly_fee, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kompaniyalar</h1>
          <p className="text-sm text-muted-foreground">Barcha kompaniyalarni boshqarish</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Kompaniya qo'shish
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Jami kompaniyalar</p>
          <p className="mt-1 text-2xl font-bold">{totalCompanies}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Oylik daromad (jami)</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">O'rtacha obuna narxi</p>
          <p className="mt-1 text-2xl font-bold">
            {totalCompanies > 0 ? formatCurrency(monthlyTotal / totalCompanies) : '—'}
          </p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Kompaniya nomi yoki telefon..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company, i) => (
            <motion.div key={company.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{company.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />{company.phone}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(company)}>
                        <Edit2 className="h-4 w-4" />Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(company)}>
                        <Trash2 className="h-4 w-4" />O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Oylik obuna</p>
                    <p className="font-semibold text-primary">{formatCurrency(company.monthly_fee)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {company.bot_token && (
                      <Badge variant="secondary"><Bot className="h-3 w-3" />Bot</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Qo'shilgan: {formatDate(company.created_at)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Kompaniyalar topilmadi</p>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi kompaniya</DialogTitle>
            <DialogDescription>Kompaniya ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <CompanyFormFields register={register} errors={errors} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Bekor</Button>
              <Button type="submit" disabled={createCompany.isPending}>
                {createCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Qo'shish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kompaniyani tahrirlash</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <CompanyFormFields register={editForm.register} errors={editForm.formState.errors} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Bekor</Button>
              <Button type="submit" disabled={updateCompany.isPending}>
                {updateCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kompaniyani o'chirish</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.name}" kompaniyasini o'chirishni tasdiqlaysizmi? Barcha ma'lumotlar o'chib ketadi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Bekor</Button>
            <Button variant="destructive" disabled={deleteCompany.isPending}
              onClick={() => deleteCompany.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}>
              {deleteCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type FormFields = { name: string; phone: string; monthly_fee: number; bot_token?: string }

function CompanyFormFields({ register, errors }: {
  register: import('react-hook-form').UseFormRegister<FormFields>
  errors: import('react-hook-form').FieldErrors<FormFields>
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Kompaniya nomi</Label>
        <Input placeholder="CleanShoe Tashkent" {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Telefon raqami</Label>
        <Input placeholder="+998 71 000 00 00" {...register('phone')} />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Oylik obuna narxi (so'm)</Label>
        <Input type="number" step="10000" placeholder="500000" {...register('monthly_fee')} />
        {errors.monthly_fee && <p className="text-xs text-destructive">{errors.monthly_fee.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Telegram Bot Token (ixtiyoriy)</Label>
        <Input placeholder="123456:AAH..." {...register('bot_token')} />
        <p className="text-xs text-muted-foreground">@BotFather dan olingan token</p>
      </div>
    </>
  )
}

export default CompaniesPage
