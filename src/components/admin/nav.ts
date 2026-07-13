import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  Crown,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Megaphone,
  Monitor,
  PackagePlus,
  QrCode,
  Receipt,
  Upload,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const ADMIN_NAV: readonly NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: ListChecks },
  { href: "/admin/check-in", label: "Check-in", icon: QrCode },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bookings/new", label: "New Booking", icon: CalendarPlus },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/accounting", label: "Accounting", icon: LineChart },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/influencers", label: "Influencers", icon: Megaphone },
  { href: "/admin/import", label: "Import Excel", icon: Upload },
  { href: "/admin/screens", label: "Screens", icon: Monitor },
  { href: "/admin/addons", label: "Add-ons", icon: PackagePlus },
  { href: "/admin/membership", label: "Membership", icon: Crown },
] as const;

export function matchesNav(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getPageTitle(pathname: string): string {
  // Prefer longest matching href so /admin/bookings/new beats /admin/bookings.
  let best: NavItem | null = null;
  for (const item of ADMIN_NAV) {
    if (matchesNav(pathname, item)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best?.label ?? "Admin";
}
