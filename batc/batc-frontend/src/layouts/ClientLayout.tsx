import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { Home, ClipboardList, Package, User, MessageSquare, FileCheck, LogOut } from "lucide-react";

const tabs = [
  { to: "/app/home",         icon: Home,          label: "Home" },
  { to: "/app/programs",     icon: ClipboardList, label: "Programs" },
  { to: "/app/applications", icon: FileCheck,     label: "My Apps" },
  { to: "/app/claims",       icon: Package,       label: "Claims" },
  { to: "/app/feedback",     icon: MessageSquare, label: "Feedback" },
  { to: "/app/profile",      icon: User,          label: "Profile" },
];

export function ClientLayout() {
  const { logout, refreshToken, user } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate("/login");
  }

  return (
    <div className="agri-bg-client flex flex-col h-screen overflow-hidden">

      {/* Dark glass top header */}
      <header className="glass-header-dark shrink-0 flex items-center justify-between px-4" style={{ height: 52 }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(116, 198, 157, 0.20)", border: "1px solid rgba(116,198,157,0.30)" }}
          >
            <Home size={12} style={{ color: "#74c69d" }} />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase leading-none"
               style={{ color: "rgba(200, 235, 215, 0.95)" }}>BATC</p>
            {user?.first_name && (
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "rgba(116, 198, 157, 0.55)" }}>
                Hi, {user.first_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell variant="dark" />
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-xl transition-colors"
            style={{ color: "rgba(116, 198, 157, 0.55)" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Frosted white bottom navigation */}
      <nav className="glass-nav-bottom shrink-0 flex" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[10px] font-medium transition-all duration-150 min-h-[52px]",
                isActive ? "" : "text-gray-400 hover:text-gray-600"
              )
            }
            style={({ isActive }) => isActive
              ? { color: "var(--color-agri-600)" }
              : {}
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className="p-1.5 rounded-lg transition-all"
                  style={isActive ? { background: "rgba(64, 145, 108, 0.12)" } : {}}
                >
                  <Icon size={18} />
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
