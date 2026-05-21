import { Outlet, NavLink, useNavigate, useMatches } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import {
  Home, ClipboardList, Package, User, MessageSquare, FileCheck, LogOut,
  Leaf, Sprout, ChevronRight, ChevronDown,
} from "lucide-react";

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
  const matches = useMatches();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Derive breadcrumb from route handle (set in router.tsx)
  const lastMatch = matches[matches.length - 1];
  const breadcrumb = (lastMatch?.handle as { breadcrumb?: string } | undefined)?.breadcrumb ?? "Home";

  // Close profile menu on outside click / escape
  useEffect(() => {
    if (!profileOpen) return;
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  async function handleLogout() {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate("/login");
  }

  const firstName = user?.first_name ?? user?.username ?? "Farmer";
  const fullName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
    : "";
  const displayName = fullName || user?.username || "Farmer";
  const initials = fullName
    ? fullName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : (user?.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* ────── Desktop sidebar (hidden on mobile) ────── */}
      <aside
        className="hidden md:flex flex-col bg-[var(--color-ink-900)] shrink-0"
        style={{ width: 200, minWidth: 200 }}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(116, 198, 157, 0.18)" }}
            >
              <Leaf size={13} style={{ color: "#74c69d" }} />
            </div>
            <div className="leading-none">
              <p className="text-[12px] font-bold tracking-widest uppercase text-[var(--color-batc-navy-text-active)]">
                BATC
              </p>
              <p className="text-[9px] mt-0.5 text-[var(--color-batc-navy-text)]">
                Farmer Portal
              </p>
            </div>
          </div>
        </div>

        {/* Welcome strip */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 shrink-0">
              <Sprout size={14} style={{ color: "#74c69d" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--color-batc-navy-text)] truncate">Welcome</p>
              <p className="text-[12px] font-semibold text-[var(--color-batc-navy-text-active)] truncate">
                {firstName}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto" aria-label="Primary">
          <p className="px-4 mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-batc-navy-text)]/60">
            Navigation
          </p>
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-2.5 px-4 py-1.5 text-[13px] font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:bg-[var(--color-ink-700)]",
                    isActive
                      ? "text-[var(--color-batc-navy-text-active)]"
                      : "text-[var(--color-batc-navy-text)] hover:text-[var(--color-batc-navy-text-active)] hover:bg-[var(--color-ink-700)]/60",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r"
                        style={{ background: "var(--color-brand-500)" }}
                        aria-hidden="true"
                      />
                    )}
                    <Icon size={14} className={isActive ? "text-[var(--color-brand-500)]" : ""} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 py-3 border-t border-white/[0.08]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-[var(--color-batc-navy-text)] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ────── Main column ────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header (visible only on mobile) */}
        <header
          className="md:hidden flex items-center justify-between px-4 shrink-0 bg-[var(--color-ink-900)]"
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

        {/* Desktop topbar (hidden on mobile) */}
        <header className="hidden md:flex h-12 items-center justify-between px-5 border-b border-gray-200 bg-white shrink-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">Farmer</span>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-800 font-semibold">{breadcrumb}</span>
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Profile dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-1.5 h-8 rounded-md hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
                >
                  {initials}
                </div>
                <div className="hidden lg:block text-xs text-left leading-tight">
                  <p className="font-semibold text-gray-800 max-w-[120px] truncate">{displayName}</p>
                  <p className="text-gray-400">Farmer</p>
                </div>
                <ChevronDown
                  size={12}
                  className={cn("text-gray-400 transition-transform", profileOpen && "rotate-180")}
                />
              </button>
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-10 w-56 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50"
                >
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email ?? user?.username}</p>
                  </div>
                  <div className="py-1">
                    <NavLink
                      to="/app/profile"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <User size={13} /> My Profile
                    </NavLink>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="md:p-6 md:max-w-5xl">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tabs (hidden on desktop) */}
        <nav
          aria-label="Primary"
          className="md:hidden shrink-0 border-t border-gray-200 bg-white flex"
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
                    : "text-gray-400 hover:text-gray-700",
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
    </div>
  );
}
