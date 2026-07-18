import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Moon, Save, Sun, Monitor, Building2, User as UserIcon, Lock, Palette } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useCompany, useUpdateCompany, useUpdatePassword, useUpdateProfile } from '@/hooks/useSettings'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { session, isAdmin } = useAuth()
  const { data: company, isLoading: companyLoading } = useCompany()
  const updateProfile = useUpdateProfile()
  const updateCompany = useUpdateCompany()
  const updatePassword = useUpdatePassword()
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)

  // Profile form
  const profileForm = useForm({ defaultValues: { fullname: '', phone: '' } })
  useEffect(() => {
    if (session) {
      profileForm.reset({ fullname: session.fullname, phone: '' })
    }
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  // Company form
  const companyForm = useForm({ defaultValues: { name: '', phone: '' } })
  useEffect(() => {
    if (company) {
      companyForm.reset({ name: company.name, phone: company.phone })
    }
  }, [company]) // eslint-disable-line react-hooks/exhaustive-deps

  // Password form
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const passwordMismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sozlamalar</h1>
        <p className="text-sm text-muted-foreground">Profil, kompaniya va tizim sozlamalarini boshqarish</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4" />
            Profil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4" />
              Kompaniya
            </TabsTrigger>
          )}
          <TabsTrigger value="security">
            <Lock className="h-4 w-4" />
            Xavfsizlik
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4" />
            Ko'rinish
          </TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="profile">
          <Card className="max-w-xl p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Shaxsiy ma'lumotlar</h2>
            <form
              onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="profile-fullname">To'liq ism</Label>
                <Input id="profile-fullname" {...profileForm.register('fullname')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Telefon raqami</Label>
                <Input id="profile-phone" placeholder="+998 90 123 45 67" {...profileForm.register('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={session?.email ?? ''} disabled />
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Saqlash
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Company tab */}
        {isAdmin && (
          <TabsContent value="company">
            <Card className="max-w-xl p-5">
              <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Kompaniya ma'lumotlari</h2>
              {companyLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <form
                  onSubmit={companyForm.handleSubmit((values) => updateCompany.mutate(values))}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="company-name">Kompaniya nomi</Label>
                    <Input id="company-name" {...companyForm.register('name')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company-phone">Telefon raqami</Label>
                    <Input id="company-phone" {...companyForm.register('phone')} />
                  </div>
                  <Button type="submit" disabled={updateCompany.isPending}>
                    {updateCompany.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Saqlash
                  </Button>
                </form>
              )}
            </Card>
          </TabsContent>
        )}

        {/* Security tab */}
        <TabsContent value="security">
          <Card className="max-w-xl p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Parolni o'zgartirish</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!passwordMismatch && newPassword.length >= 6) {
                  updatePassword.mutate(newPassword, {
                    onSuccess: () => {
                      setNewPassword('')
                      setConfirmPassword('')
                    },
                  })
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Yangi parol</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Parolni tasdiqlash</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordMismatch && <p className="text-xs text-destructive">Parollar mos kelmadi</p>}
              </div>
              <Button type="submit" disabled={updatePassword.isPending || newPassword.length < 6 || passwordMismatch}>
                {updatePassword.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Parolni yangilash
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Appearance tab */}
        <TabsContent value="appearance">
          <Card className="max-w-xl p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Mavzu</h2>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: 'light', label: 'Yorug\'', icon: Sun },
                  { value: 'dark', label: 'Tungi', icon: Moon },
                  { value: 'system', label: 'Tizim', icon: Monitor },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors',
                    theme === opt.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
