import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { Home, ClipboardList, Package, User, MessageSquare, FileCheck, LogOut, Leaf } from "lucide-react";

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
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-gray-50">
      <header
        className="flex items-center justify-between px-4 shrink-0 bg-[var(--color-ink-900)]"
        style={{
          height: 52,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(116, 198, 157, 0.18)" }}
            aria-hidden="true"
          >
            <Leaf size={13} style={{ color: "#74c69d" }} />
          </div>
          <div className="leading-none">
            <p className="text-[12px] font-bold tracking-widest uppercase text-[var(--color-batc-navy-text-active)]">
              BATC
            </p>
            {user?.first_name && (
              <p className="text-[10px] mt-0.5 text-[var(--color-batc-navy-text)]">
                Hi, {user.first_name}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell variant="dark" />
          <button
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            className="p-2 rounded-md text-[var(--color-batc-navy-text)] hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav
        aria-label="Primary"
        className="shrink-0 border-t border-gray-200 bg-white flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex-1 flex flex-col items-center justify-center py-2 text-[11px] gap-0.5 transition-colors min-h-[52px]",
                "focus-visible:outline-none focus-visible:bg-gray-50",
                isActive
                  ? "text-[var(--color-brand-600)]"
                  : "text-gray-400 hover:text-gray-700"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full"
                    style={{ background: "var(--color-brand-500)" }}
                  />
                )}
                <Icon size={18} />
                <span className={cn("font-medium", isActive && "font-semibold")}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
