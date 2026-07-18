import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Send,
  UserCog,
  Settings,
  Footprints,
  ChevronsLeft,
  Building2,
  GitBranch,
  CreditCard,
  Wallet,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Buyurtmalar', to: '/orders', icon: ClipboardList },
  { label: 'Mijozlar', to: '/customers', icon: Users },
  { label: 'Reyting', to: '/rankings', icon: Trophy },
  { label: 'Statistika', to: '/statistics', icon: BarChart3, roles: ['admin', 'director', 'super_admin'] },
  { label: 'Telegram Bot', to: '/telegram-bot', icon: Send, roles: ['director', 'super_admin'] },
  { label: 'Xodimlar', to: '/workers', icon: UserCog, roles: ['admin', 'director', 'super_admin'] },
  { label: 'Filiallar', to: '/branches', icon: GitBranch, roles: ['director', 'super_admin'] },
  { label: 'Maosh', to: '/salaries', icon: Wallet, roles: ['worker', 'director', 'super_admin'] },
  { label: 'Kompaniyalar', to: '/companies', icon: Building2, roles: ['super_admin'] },
  { label: 'Obunalar', to: '/subscriptions', icon: CreditCard, roles: ['super_admin'] },
  { label: 'Sozlamalar', to: '/settings', icon: Settings },
]

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { role } = useAuth()

  const items = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)))

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 264 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative hidden h-screen flex-col border-r border-border bg-card/60 backdrop-blur-xl lg:flex"
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
          <Footprints className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight whitespace-nowrap overflow-hidden">
            SoleCare
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:bg-secondary',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-primary')} />
                {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronsLeft className={cn('h-[18px] w-[18px] transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Yig'ish</span>}
        </button>
      </div>
    </motion.aside>
  )
}
