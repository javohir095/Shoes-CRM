import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore, applyTheme } from '@/store/ui.store'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import OrdersPage from '@/pages/OrdersPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import CustomersPage from '@/pages/CustomersPage'
import StatisticsPage from '@/pages/StatisticsPage'
import TelegramBotPage from '@/pages/TelegramBotPage'
import WorkersPage from '@/pages/WorkersPage'
import BranchesPage from '@/pages/BranchesPage'
import SalariesPage from '@/pages/SalariesPage'
import CompaniesPage from '@/pages/CompaniesPage'
import SubscriptionsPage from '@/pages/SubscriptionsPage'
import SettingsPage from '@/pages/SettingsPage'
import RankingsPage from '@/pages/RankingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  const init = useAuthStore((s) => s.init)
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    // Apply saved theme immediately on mount
    applyTheme(theme)
    // Initialize auth
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin+ */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'director', 'super_admin']} />}>
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/workers" element={<WorkersPage />} />
          </Route>

          {/* Director+ */}
          <Route element={<ProtectedRoute allowedRoles={['director', 'super_admin']} />}>
            <Route path="/telegram-bot" element={<TelegramBotPage />} />
            <Route path="/branches" element={<BranchesPage />} />
          </Route>

          {/* Salaries: director/super_admin manage, worker sees own */}
          <Route element={<ProtectedRoute allowedRoles={['worker', 'director', 'super_admin']} />}>
            <Route path="/salaries" element={<SalariesPage />} />
          </Route>

          {/* Super Admin only */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
