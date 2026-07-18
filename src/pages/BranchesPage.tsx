import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Building2, GitBranch, Loader2, MoreVertical, Phone, Plus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useBranches, useCreateBranch, useDeleteBranch, useUpdateBranch } from '@/hooks/useBranches'
import { useAllCompanies } from '@/hooks/useCompanies'
import { useAuth } from '@/hooks/useAuth'
import type { Branch } from '@/types/database'

const schema = z.object({
  company_id: z.string().min(1, 'Kompaniyani tanlang'),
  name: z.string().min(2, 'Filial nomini kiriting'),
  address: z.string().optional(),
  phone: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function BranchesPage() {
  const { isSuperAdmin, companyId } = useAuth()
  const { data, isLoading } = useBranches()
  const { data: companies } = useAllCompanies()
  const createBranch = useCreateBranch()
  const updateBranch = useUpdateBranch()
  const deleteBranch = useDeleteBranch()

  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { company_id: companyId ?? '' },
  })
  const selectedCompanyId = watch('company_id')

  const onSubmit = (values: FormValues) => {
    createBranch.mutate(values, {
      onSuccess: () => { setCreateOpen(false); reset({ company_id: companyId ?? '' }) },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Filiallar</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `Jami ${data.length} ta filial` : 'Yuklanmoqda...'}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Filial qo'shish
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((branch, i) => (
            <motion.div key={branch.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">{branch.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant={branch.is_active ? 'success' : 'secondary'}>
                          {branch.is_active ? 'Faol' : 'Nofaol'}
                        </Badge>
                        {isSuperAdmin && branch.company && (
                          <Badge variant="outline">{branch.company.name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() =>
                        updateBranch.mutate({ id: branch.id, values: { is_active: !branch.is_active } })
                      }>
                        {branch.is_active ? 'Nofaol qilish' : 'Faollashtirish'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(branch)}>
                        <Trash2 className="h-4 w-4" />O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  {branch.phone && (
                    <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{branch.phone}</p>
                  )}
                  {branch.address && (
                    <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{branch.address}</p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Filiallar topilmadi</p>
          <p className="mt-1 text-sm text-muted-foreground">Birinchi filialngizni qo'shing</p>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yangi filial</DialogTitle>
            <DialogDescription>Kompaniyangizga yangi filial qo'shing</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-1.5">
                <Label>Kompaniya</Label>
                <Select value={selectedCompanyId} onValueChange={(v) => setValue('company_id', v)}>
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
              <Label>Filial nomi</Label>
              <Input placeholder="Chilonzor filiali" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Manzil (ixtiyoriy)</Label>
              <Input placeholder="Toshkent, Chilonzor 5" {...register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon (ixtiyoriy)</Label>
              <Input placeholder="+998 90 000 00 00" {...register('phone')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
              <Button type="submit" disabled={createBranch.isPending}>
                {createBranch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Qo'shish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filialni o'chirish</DialogTitle>
            <DialogDescription>
              "{deleteTarget?.name}" filialni o'chirishni tasdiqlaysizmi? Bu amal qaytarilmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={() => {
              deleteBranch.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })
            }} disabled={deleteBranch.isPending}>
              {deleteBranch.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BranchesPage
