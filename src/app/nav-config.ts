import type { UserRole } from "@/types/database.types";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  Wallet,
  BadgeDollarSign,
  Star,
  Trophy,
  ScanLine,
  Settings,
  Bot,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    roles: ["super_admin", "admin", "worker"],
  },
  {
    label: "Buyurtmalar",
    path: "/orders",
    icon: ClipboardList,
    roles: ["super_admin", "admin", "worker"],
  },
  {
    label: "QR Scanner",
    path: "/qr-scanner",
    icon: ScanLine,
    roles: ["super_admin", "admin", "worker"],
  },
  {
    label: "Mijozlar",
    path: "/customers",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Xodimlar",
    path: "/workers",
    icon: Users,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Filiallar",
    path: "/companies",
    icon: Building2,
    roles: ["super_admin"],
  },
  {
    label: "Moliya",
    path: "/finance",
    icon: Wallet,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Oyliklar",
    path: "/salary",
    icon: BadgeDollarSign,
    roles: ["super_admin", "admin", "worker"],
  },
  {
    label: "Mijozlar fikri",
    path: "/reviews",
    icon: Star,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Reyting",
    path: "/rankings",
    icon: Trophy,
    roles: ["super_admin", "admin", "worker"],
  },
  {
    label: "Telegram Bot",
    path: "/telegram-bot",
    icon: Bot,
    roles: ["super_admin", "admin"],
  },
  {
    label: "Sozlamalar",
    path: "/settings",
    icon: Settings,
    roles: ["super_admin", "admin"],
  },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
