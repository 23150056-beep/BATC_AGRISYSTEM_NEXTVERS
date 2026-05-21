import { Outlet, NavLink, useMatches, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { CommandPalette, useCommandPalette } from "@/features/command/CommandPalette";
import {
  Leaf, Package, ClipboardList, Truck, LogOut, Users, BarChart2,
  LayoutDashboard, MessageSquare, Search, ChevronRight, ChevronDown,
} from "lucide-react";

// Group items to match the admin sidebar story pattern
const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/staff/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/staff/farmers", icon: Leaf,  label: "Farmers" },
      { to: "/staff/users",   icon: Users, label: "Users" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/staff/applications", icon: ClipboardList, label: "Applications" },
      { to: "/staff/distribution", icon: Truck,         label: "Distribution" },
      { to: "/staff/inventory",    icon: Package,       label: "Inventory" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/staff/feedback", icon: MessageSquare, label: "Feedback", alertKey: true as const },
      { to: "/staff/reports",  icon: BarChart2,     label: "Reports" },
    ],
  },
] as const;

export function StaffLayout() {
  const { logout, refreshToken, user } = useAuthStore();
  const navigate = useNavigate();
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const breadcrumb = (lastMatch?.handle as { breadcrumb?: string } | undefined)?.breadcrumb ?? "Staff";
  const palette = useCommandPalette();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: alertData } = useQuery({
    queryKey: ["feedback-quality-count"],
    queryFn:  () => feedbackApi.qualityAlertCount(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
  const qualityCount = alertData?.count ?? 0;

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

  const fullName = user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "";
  const displayName = fullName || user?.username || "User";
  const initials = fullName
    ? fullName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()
    : (user?.username ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ────── Sidebar ────── */}
      <aside
        className="flex flex-col bg-[var(--color-ink-900)] shrink-0"
        style={{ width: 192, minWidth: 192 }}
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
              <p className="text-[12px] font-bold tracking-widest uppercase text-[var(--color-batc-navy-text-active)]">BATC</p>
              <p className="text-[9px] mt-0.5 text-[var(--color-batc-navy-text)]">Staff Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto" aria-label="Primary">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-4 mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--color-batc-navy-text)]/60">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const alertKey = "alertKey" in item ? item.alertKey : false;
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
                        {alertKey && qualityCount > 0 && (
                          <span
                            aria-label={`${qualityCount} alerts`}
                            className="bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                          >
                            {qualityCount > 9 ? "9+" : qualityCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ────── Main column ────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-12 flex items-center justify-between px-5 border-b border-gray-200 bg-white shrink-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">Staff</span>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-800 font-semibold">{breadcrumb}</span>
          </nav>

          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              type="button"
              onClick={palette.open}
              className={cn(
                "hidden md:flex items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-md transition-all",
                "text-xs text-gray-500 bg-white hover:bg-gray-50",
                "border border-gray-200 hover:border-gray-300",
                "min-w-[220px] lg:min-w-[280px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40 focus-visible:border-[var(--color-brand-500)]",
              )}
              aria-label="Search pages and actions (Ctrl+K)"
              aria-keyshortcuts="Control+K Meta+K"
            >
              <Search size={13} className="text-gray-400 shrink-0" />
              <span className="flex-1 text-left text-gray-400">Search…</span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-[10px] text-gray-500 font-mono shrink-0">
                ⌘K
              </kbd>
            </button>

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
                  <p className="text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
                <ChevronDown size={12} className={cn("text-gray-400 transition-transform", profileOpen && "rotate-180")} />
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
                    <button
                      role="menuitem"
                      onClick={() => { setProfileOpen(false); palette.open(); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Search size={13} /> Search…
                      <kbd className="ml-auto px-1 rounded bg-gray-100 text-[10px] font-mono text-gray-500">⌘K</kbd>
                    </button>
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

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={palette.isOpen} onOpenChange={palette.setOpen} role="STAFF" />
    </div>
  );
}
