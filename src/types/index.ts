import type {
  Order, OrderStatus, User, UserRole, Company, Branch,
  CompanySubscription, EmployeeSalary, SalaryPayment, OrderRating
} from './database'

export interface AuthSession {
  userId: string
  email: string
  company_id: string | null   // null for super_admin
  branch_id: string | null    // null for directors and above
  role: UserRole
  fullname: string
}

export interface DashboardStats {
  todayOrders: number
  inProgressOrders: number
  readyOrders: number
  monthlyRevenue: number
  totalCustomers: number
}

export interface DailyOrdersPoint {
  date: string
  count: number
}

export interface MonthlyRevenuePoint {
  month: string
  revenue: number
}

export interface ServiceBreakdownPoint {
  service_type: string
  count: number
}

export interface OrderFilters {
  search?: string
  status?: OrderStatus | 'all'
  dateFrom?: string
  dateTo?: string
  workerId?: string | 'all'
  branchId?: string | 'all'
}

export type {
  Order, OrderStatus, User, UserRole, Company, Branch,
  CompanySubscription, EmployeeSalary, SalaryPayment, OrderRating
}
