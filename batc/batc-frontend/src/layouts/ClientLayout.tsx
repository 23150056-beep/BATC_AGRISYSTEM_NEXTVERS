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
      {/* Dark forest glass top header */}
      <header
        className="glass-dark flex items-center justify-between px-4 h-12 shrink-0"
        style={{ borderBottom: "1px solid rgba(116, 198, 157, 0.14)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: "rgba(183, 228, 199, 0.95)" }}
          >
            BATC
          </span>
          {user?.first_name && (
            <span
              className="text-xs hidden sm:inline"
              style={{ color: "rgba(116, 198, 157, 0.60)" }}
            >
              · Hi, {user.first_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell variant="dark" />
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-md transition-colors"
            style={{ color: "rgba(116, 198, 157, 0.55)" }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Frosted bottom navigation */}
      <nav className="glass-nav-bottom shrink-0 flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center justify-center py-2 text-[11px] gap-1 transition-all duration-150 min-h-[48px]",
                isActive
                  ? "font-semibold"
                  : "text-gray-400 hover:text-gray-600"
              )
            }
            style={({ isActive }) =>
              isActive
                ? { color: "var(--color-agri-600)" }
                : {}
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
