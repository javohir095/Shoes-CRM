import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Users, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface MobileNavItem {
  label: string
  to: string
  icon: React.ElementType
  roles?: UserRole[]
}

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { label: 'Bosh sahifa', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Buyurtmalar', to: '/orders', icon: ClipboardList },
  { label: 'Mijozlar', to: '/customers', icon: Users },
  { label: 'Statistika', to: '/statistics', icon: BarChart3, roles: ['admin', 'director', 'super_admin'] },
  { label: 'Sozlamalar', to: '/settings', icon: Settings },
]

export function MobileNav() {
  const { role } = useAuth()
  const items = MOBILE_NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/80 px-2 py-2 backdrop-blur-xl lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
