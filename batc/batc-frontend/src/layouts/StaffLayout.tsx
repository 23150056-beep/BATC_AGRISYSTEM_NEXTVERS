import { Outlet, NavLink, useMatches, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { Tooltip } from "@/components/ui";
import { CommandPalette, useCommandPalette } from "@/features/command/CommandPalette";
import {
  Leaf, Package, ClipboardList, Truck, LogOut, Users, BarChart2, LayoutDashboard, MessageSquare, Search,
} from "lucide-react";

const navItems = [
  { to: "/staff/dashboard",    icon: LayoutDashboard, label: "Dashboard",    alertKey: false },
  { to: "/staff/farmers",      icon: Leaf,            label: "Farmers",      alertKey: false },
  { to: "/staff/applications", icon: ClipboardList,   label: "Applications", alertKey: false },
  { to: "/staff/distribution", icon: Truck,           label: "Distribution", alertKey: false },
  { to: "/staff/inventory",    icon: Package,         label: "Inventory",    alertKey: false },
  { to: "/staff/users",        icon: Users,           label: "Users",        alertKey: false },
  { to: "/staff/feedback",     icon: MessageSquare,   label: "Feedback",     alertKey: true  },
  { to: "/staff/reports",      icon: BarChart2,       label: "Reports",      alertKey: false },
];

export function StaffLayout() {
  const { logout, refreshToken, user } = useAuthStore();
  const navigate = useNavigate();
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const breadcrumb = (lastMatch?.handle as { breadcrumb?: string } | undefined)?.breadcrumb ?? "";
  const palette = useCommandPalette();

  const { data: alertData } = useQuery({
    queryKey: ["feedback-quality-count"],
    queryFn:  () => feedbackApi.qualityAlertCount(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
  const qualityCount = alertData?.count ?? 0;

  async function handleLogout() {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate("/login");
  }

  const initials = (user?.first_name?.[0] ?? user?.username?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className="flex flex-col items-center py-3 gap-0.5 border-r border-gray-200 bg-white shrink-0"
        style={{ width: 52, minWidth: 52 }}
      >
        {/* Brand mark */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 shrink-0"
          style={{ background: "var(--color-brand-100)" }}
        >
          <Leaf size={14} style={{ color: "var(--color-brand-600)" }} />
        </div>

        {navItems.map(({ to, icon: Icon, label, alertKey }) => (
          <Tooltip key={to} label={label} side="right" delay={250}>
            <NavLink
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  "relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40",
                  isActive
                    ? "bg-[#EAF3DE] text-[#3B6D11]"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                )
              }
            >
              <Icon size={17} />
              {alertKey && qualityCount > 0 && (
                <span
                  aria-label={`${qualityCount} pending quality alerts`}
                  className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5"
                >
                  {qualityCount > 9 ? "9+" : qualityCount}
                </span>
              )}
            </NavLink>
          </Tooltip>
        ))}

        <div className="flex-1" />

        {/* User avatar */}
        <Tooltip label={`${user?.first_name ?? user?.username} (Staff)`} side="right">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
            aria-hidden="true"
          >
            {initials}
          </div>
        </Tooltip>

        <Tooltip label="Logout" side="right">
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          >
            <LogOut size={17} />
          </button>
        </Tooltip>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
          <span className="text-sm text-gray-700 font-semibold">
            {breadcrumb || "Staff Portal"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={palette.open}
              className="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-1.5 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
              aria-label="Search and quick actions (Ctrl+K)"
            >
              <Search size={13} />
              <span>Search</span>
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-500 font-mono">
                Ctrl K
              </kbd>
            </button>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={palette.isOpen} onOpenChange={palette.setOpen} role="STAFF" />
    </div>
  );
}
