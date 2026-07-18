import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/app/app-layout";
import { ProtectedRoute, RoleGuard } from "@/app/route-guards";

import LoginPage from "@/pages/auth/login-page";
import DashboardPage from "@/pages/dashboard/dashboard-page";
import OrdersListPage from "@/pages/orders/orders-list-page";
import NewOrderPage from "@/pages/orders/new-order-page";
import OrderDetailPage from "@/pages/orders/order-detail-page";
import QrScannerPage from "@/pages/qr-scanner/qr-scanner-page";
import CustomersPage from "@/pages/customers/customers-page";
import WorkersPage from "@/pages/workers/workers-page";
import CompaniesPage from "@/pages/companies/companies-page";
import FinancePage from "@/pages/finance/finance-page";
import SalaryPage from "@/pages/salary/salary-page";
import ReviewsPage from "@/pages/reviews/reviews-page";
import RankingsPage from "@/pages/rankings/rankings-page";
import TelegramBotPage from "@/pages/settings/telegram-bot-page";
import SettingsPage from "@/pages/settings/settings-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "orders", element: <OrdersListPage /> },
      { path: "orders/new", element: <NewOrderPage /> },
      { path: "orders/:id", element: <OrderDetailPage /> },
      { path: "qr-scanner", element: <QrScannerPage /> },
      {
        path: "customers",
        element: (
          <RoleGuard allow={["super_admin", "admin"]}>
            <CustomersPage />
          </RoleGuard>
        ),
      },
      {
        path: "workers",
        element: (
          <RoleGuard allow={["super_admin", "admin"]}>
            <WorkersPage />
          </RoleGuard>
        ),
      },
      {
        path: "companies",
        element: (
          <RoleGuard allow={["super_admin"]}>
            <CompaniesPage />
          </RoleGuard>
        ),
      },
      {
        path: "finance",
        element: (
          <RoleGuard allow={["super_admin", "admin"]}>
            <FinancePage />
          </RoleGuard>
        ),
      },
      { path: "salary", element: <SalaryPage /> },
      {
        path: "reviews",
        element: (
          <RoleGuard allow={["super_admin", "admin"]}>
            <ReviewsPage />
          </RoleGuard>
        ),
      },
      { path: "rankings", element: <RankingsPage /> },
      {
        path: "telegram-bot",
        element: (
          <RoleGuard allow={["super_admin", "admin"]}>
            <TelegramBotPage />
          </RoleGuard>
        ),
      },
      {
        path: "settings",
        element: (
          <RoleGuard allow={["super_admin", "admin"]}>
            <SettingsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
