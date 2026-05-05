import { Outlet, NavLink, useNavigate, useMatches } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import {
  Users, Package, Leaf, BarChart2, Bell, ClipboardList,
  Truck, LogOut, LayoutDashboard, FileCheck, MessageSquare,
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users",         icon: Users,           label: "Users" },
  { to: "/admin/farmers",       icon: Leaf,            label: "Farmers" },
  { to: "/admin/programs",      icon: ClipboardList,   label: "Programs" },
  { to: "/admin/applications",  icon: FileCheck,       label: "Applications" },
  { to: "/admin/inventory",     icon: Package,         label: "Inventory" },
  { to: "/admin/distribution",  icon: Truck,           label: "Distribution" },
  { to: "/admin/feedback",      icon: MessageSquare,   label: "Feedback", alertKey: true },
  { to: "/admin/reports",       icon: BarChart2,       label: "Reports" },
  { to: "/admin/announcements", icon: Bell,            label: "Announcements" },
];

export function AdminLayout() {
  const { logout, refreshToken, user } = useAuthStore();
  const navigate = useNavigate();
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const breadcrumb = (lastMatch?.handle as { breadcrumb?: string } | undefined)?.breadcrumb ?? "Admin";

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

  const fullName = user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "";
  const initials = fullName
    ? fullName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : (user?.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="agri-bg flex h-screen overflow-hidden">
      {/* Dark forest glass sidebar */}
      <aside
        className="glass-dark flex flex-col"
        style={{
          width: 168,
          minWidth: 168,
          borderRight: "1px solid rgba(116, 198, 157, 0.14)",
        }}
      >
        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: "rgba(183, 228, 199, 0.95)" }}>
            BATC
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(116, 198, 157, 0.55)" }}>
            AgriSystem
          </p>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, alertKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-white bg-white/[0.12]"
                    : "text-white/50 hover:text-white/85 hover:bg-white/[0.07]"
                )
              }
            >
              <Icon size={15} />
              <span className="flex-1">{label}</span>
              {alertKey && qualityCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {qualityCount > 9 ? "9+" : qualityCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Active nav indicator dot */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(116, 198, 157, 0.7)" }} />
            <span className="text-[10px]" style={{ color: "rgba(116, 198, 157, 0.5)" }}>Connected</span>
          </div>
        </div>
      </aside>

      {/* Content area — light translucent surface over the gradient */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "rgba(243, 250, 246, 0.93)" }}
      >
        {/* Frosted glass header */}
        <header className="glass-light-panel h-12 flex items-center justify-between px-5 shrink-0">
          <div className="text-sm text-gray-700 font-medium">{breadcrumb}</div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div
              className="flex items-center gap-2 pl-3 ml-1"
              style={{ borderLeft: "1px solid rgba(52, 168, 83, 0.14)" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(52, 168, 83, 0.12)", color: "var(--color-agri-600)" }}
              >
                {initials}
              </div>
              <div className="text-xs">
                <p className="font-medium text-gray-800">{fullName || user?.username}</p>
                <p className="capitalize" style={{ color: "var(--color-agri-500)", fontSize: "10px" }}>{user?.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 ml-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
