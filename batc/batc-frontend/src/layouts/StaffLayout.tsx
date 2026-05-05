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
    refetchIntervalInBackground: false,
  });
  const qualityCount = alertData?.count ?? 0;

  async function handleLogout() {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate("/login");
  }

  return (
    <div className="agri-bg flex h-screen overflow-hidden">

      {/* ── Narrow icon sidebar ── */}
      <aside
        className="glass-sidebar flex flex-col items-center py-3 gap-1 shrink-0"
        style={{ width: 52, minWidth: 52 }}
      >
        {/* Mini brand mark */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center mb-2 shrink-0"
          style={{ background: "rgba(116, 198, 157, 0.18)", border: "1px solid rgba(116,198,157,0.28)" }}
        >
          <Leaf size={13} style={{ color: "#74c69d" }} />
        </div>

        {navItems.map(({ to, icon: Icon, label, alertKey }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150",
                isActive
                  ? "text-white"
                  : "text-white/40 hover:text-white/75 hover:bg-white/[0.07]"
              )
            }
            style={({ isActive }) => isActive ? {
              background: "rgba(116, 198, 157, 0.16)",
              boxShadow: "inset 0 0 0 1px rgba(116,198,157,0.22)",
            } : {}}
          >
            <Icon size={17} />
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
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-white/30 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={17} />
        </button>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="glass-header shrink-0 flex items-center justify-between px-4" style={{ height: 52 }}>
          <span className="text-sm font-semibold" style={{ color: "rgba(210, 248, 228, 0.90)" }}>
            {breadcrumb || "Staff Portal"}
          </span>
          <NotificationBell />
        </header>
        <main className="agri-main flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
