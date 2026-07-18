import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Footprints, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithLogin } from '@/services/auth.service'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  login: z.string().min(1, 'Login kiritilishi shart').min(3, "Login kamida 3 belgidan iborat bo'lishi kerak"),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  })

  if (!loading && isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true)
    try {
      await signInWithLogin(values.login, values.password)
      toast.success('Xush kelibsiz!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tizimga kirishda xatolik yuz berdi'
      if (message === 'Invalid login credentials') {
        toast.error("Login yoki parol noto'g'ri")
      } else if (message.toLowerCase().includes('invalid api key') || message.toLowerCase().includes('apikey')) {
        toast.error('Server sozlamasida xatolik. Administratorga murojaat qiling.')
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md rounded-2xl border bg-card/80 p-8 shadow-xl backdrop-blur-xl"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Footprints className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">SoleCare ga xush kelibsiz</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Login va parolingizni kiriting</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              placeholder="sardor"
              autoComplete="username"
              autoCapitalize="none"
              {...register('login')}
            />
            {errors.login && <p className="text-xs text-destructive">{errors.login.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Kirish
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Hisobingiz yo'qmi? Administratoringizga murojaat qiling.
        </p>
      </motion.div>
    </div>
  )
}

export default LoginPage
