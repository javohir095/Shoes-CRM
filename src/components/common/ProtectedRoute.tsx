import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'
import { Loader2, Footprints } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session } = useAuth()
  const loading = useAuthStore((s) => s.loading)
  const initialized = useAuthStore((s) => s.initialized)
  const location = useLocation()

  // Safety timeout: if auth takes more than 8 seconds, force initialized
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (initialized) return
    const t = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(t)
  }, [initialized])

  // Show loader while auth initializes (max 8 seconds)
  if ((loading || !initialized) && !timedOut) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Footprints className="h-7 w-7 text-primary" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Yuklanmoqda...
        </div>
      </div>
    )
  }

  // Not logged in — go to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Wrong role — go to dashboard
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
