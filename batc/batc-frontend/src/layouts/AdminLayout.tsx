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
    refetchIntervalInBackground: false,
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

      {/* ── Deep forest glass sidebar ── */}
      <aside
        className="glass-sidebar flex flex-col shrink-0"
        style={{ width: 172, minWidth: 172 }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(116, 198, 157, 0.18)", border: "1px solid rgba(116, 198, 157, 0.30)" }}
            >
              <Leaf size={14} style={{ color: "#74c69d" }} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(200, 235, 215, 0.95)" }}>BATC</p>
              <p className="text-[9px] leading-none" style={{ color: "rgba(116, 198, 157, 0.50)" }}>AgriSystem</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, alertKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.06]"
                )
              }
              style={({ isActive }) => isActive ? {
                background: "rgba(116, 198, 157, 0.16)",
                boxShadow: "inset 0 0 0 1px rgba(116,198,157,0.22)",
              } : {}}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: "#74c69d" }}
                    />
                  )}
                  <Icon size={15} />
                  <span className="flex-1">{label}</span>
                  {alertKey && qualityCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {qualityCount > 9 ? "9+" : qualityCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 text-white/40 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Content area — fully transparent so bokeh fills everything ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        <header className="glass-header shrink-0 flex items-center justify-between px-5" style={{ height: 52 }}>
          <div
            className="text-sm font-semibold"
            style={{ color: "rgba(210, 248, 228, 0.90)" }}
          >
            {breadcrumb}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div
              className="flex items-center gap-2.5 pl-3"
              style={{ borderLeft: "1px solid rgba(116, 198, 157, 0.18)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "rgba(22, 116, 54, 0.30)", border: "1px solid rgba(116,198,157,0.30)", color: "rgba(180,230,205,0.95)" }}
              >
                {initials}
              </div>
              <div className="text-xs leading-tight">
                <p className="font-semibold" style={{ color: "rgba(230, 252, 240, 0.92)" }}>{fullName || user?.username}</p>
                <p className="capitalize" style={{ color: "rgba(116, 198, 157, 0.65)" }}>{user?.role?.toLowerCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 ml-1 rounded-lg transition-all"
                style={{ color: "rgba(116,198,157,0.55)" }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,120,120,0.85)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(116,198,157,0.55)')}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        <main className="agri-main flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
