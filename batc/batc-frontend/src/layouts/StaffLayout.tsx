import { Outlet, NavLink, useMatches, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import {
  Leaf, Package, ClipboardList, Truck, LogOut, Users, BarChart2, LayoutDashboard, MessageSquare,
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
  const { logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const breadcrumb = (lastMatch?.handle as { breadcrumb?: string } | undefined)?.breadcrumb ?? "";

  const { data: alertData } = useQuery({
    queryKey: ["feedback-quality-count"],
    queryFn:  () => feedbackApi.qualityAlertCount(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,  // pause when tab is hidden (Finding #26)
  });
  const qualityCount = alertData?.count ?? 0;

  async function handleLogout() {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate("/login");
  }

  return (
    <div className="agri-bg flex h-screen overflow-hidden">
      {/* Narrow dark forest glass icon sidebar */}
      <aside
        className="glass-dark flex flex-col items-center py-3 gap-1"
        style={{
          width: 44,
          minWidth: 44,
          borderRight: "1px solid rgba(116, 198, 157, 0.14)",
        }}
      >
        {/* BATC mini-logo dot */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center mb-1"
          style={{ background: "rgba(116, 198, 157, 0.18)" }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(116, 198, 157, 0.8)" }} />
        </div>

        {navItems.map(({ to, icon: Icon, label, alertKey }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                "relative p-2.5 rounded-md transition-all duration-150",
                isActive
                  ? "bg-white/[0.14] text-white"
                  : "text-white/45 hover:bg-white/[0.08] hover:text-white/80"
              )
            }
          >
            <Icon size={18} />
            {alertKey && qualityCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                {qualityCount > 9 ? "9+" : qualityCount}
              </span>
            )}
          </NavLink>
        ))}

        <div className="flex-1" />

        <button
          onClick={handleLogout}
          title="Logout"
          className="p-2.5 rounded-md transition-all duration-150 text-white/35 hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut size={18} />
        </button>
      </aside>

      {/* Content area */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "rgba(222, 241, 229, 0.64)" }}
      >
        <header className="glass-light-panel h-11 flex items-center justify-between px-4 shrink-0">
          <span className="text-sm text-gray-700 font-medium">{breadcrumb || "Staff Portal"}</span>
          <NotificationBell />
        </header>
        <main className="agri-main flex-1 overflow-y-auto p-5 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
