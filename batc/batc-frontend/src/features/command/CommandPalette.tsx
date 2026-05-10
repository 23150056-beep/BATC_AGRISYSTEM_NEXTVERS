import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Search, ArrowRight, LayoutDashboard, Leaf, Users, Package, ClipboardList,
  Truck, BarChart2, Bell, FileCheck, MessageSquare, Home, User, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/services/api/auth.api";

type Role = "ADMIN" | "STAFF" | "CLIENT";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  to?: string;
  action?: () => void | Promise<void>;
  group: "Navigate" | "Actions";
  keywords?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

/**
 * Hook that manages the global Ctrl/Cmd-K shortcut and exposes open/close state.
 * Drop the resulting <CommandPalette /> next to the layout root.
 */
export function useCommandPalette() {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    isOpen,
    setOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
  };
}

/**
 * Global command palette — quick navigation + actions, accessible via Ctrl+K
 * (or Cmd+K on macOS). Type to filter. Arrow keys to navigate. Enter to run.
 */
export function CommandPalette({ open, onOpenChange, role }: Props) {
  const navigate = useNavigate();
  const { logout, refreshToken } = useAuthStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleLogout = useCallback(async () => {
    if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
    logout();
    navigate("/login");
  }, [refreshToken, logout, navigate]);

  // Build the command list based on role
  const items = useMemo<CommandItem[]>(() => {
    const adminNav: CommandItem[] = [
      { id: "a-dash",  label: "Dashboard",     icon: LayoutDashboard, to: "/admin/dashboard",     group: "Navigate" },
      { id: "a-users", label: "Users",         icon: Users,           to: "/admin/users",         group: "Navigate" },
      { id: "a-farm",  label: "Farmers",       icon: Leaf,            to: "/admin/farmers",       group: "Navigate", keywords: ["beneficiaries"] },
      { id: "a-prog",  label: "Programs",      icon: ClipboardList,   to: "/admin/programs",      group: "Navigate" },
      { id: "a-app",   label: "Applications",  icon: FileCheck,       to: "/admin/applications",  group: "Navigate" },
      { id: "a-inv",   label: "Inventory",     icon: Package,         to: "/admin/inventory",     group: "Navigate", keywords: ["stock", "supplies"] },
      { id: "a-dist",  label: "Distribution",  icon: Truck,           to: "/admin/distribution",  group: "Navigate", keywords: ["delivery"] },
      { id: "a-fb",    label: "Feedback",      icon: MessageSquare,   to: "/admin/feedback",      group: "Navigate" },
      { id: "a-rep",   label: "Reports",       icon: BarChart2,       to: "/admin/reports",       group: "Navigate", keywords: ["analytics"] },
      { id: "a-ann",   label: "Announcements", icon: Bell,            to: "/admin/announcements", group: "Navigate" },
    ];
    const staffNav: CommandItem[] = [
      { id: "s-dash",  label: "Dashboard",     icon: LayoutDashboard, to: "/staff/dashboard",     group: "Navigate" },
      { id: "s-farm",  label: "Farmers",       icon: Leaf,            to: "/staff/farmers",       group: "Navigate" },
      { id: "s-app",   label: "Applications",  icon: ClipboardList,   to: "/staff/applications",  group: "Navigate" },
      { id: "s-dist",  label: "Distribution",  icon: Truck,           to: "/staff/distribution",  group: "Navigate" },
      { id: "s-inv",   label: "Inventory",     icon: Package,         to: "/staff/inventory",     group: "Navigate" },
      { id: "s-users", label: "Users",         icon: Users,           to: "/staff/users",         group: "Navigate" },
      { id: "s-fb",    label: "Feedback",      icon: MessageSquare,   to: "/staff/feedback",      group: "Navigate" },
      { id: "s-rep",   label: "Reports",       icon: BarChart2,       to: "/staff/reports",       group: "Navigate" },
    ];
    const clientNav: CommandItem[] = [
      { id: "c-home", label: "Home",          icon: Home,         to: "/app/home",         group: "Navigate" },
      { id: "c-prog", label: "Programs",      icon: ClipboardList, to: "/app/programs",     group: "Navigate" },
      { id: "c-app",  label: "Applications",  icon: FileCheck,    to: "/app/applications", group: "Navigate" },
      { id: "c-clm",  label: "Claims",        icon: Package,      to: "/app/claims",       group: "Navigate" },
      { id: "c-fb",   label: "Feedback",      icon: MessageSquare, to: "/app/feedback",    group: "Navigate" },
      { id: "c-prof", label: "Profile",       icon: User,         to: "/app/profile",      group: "Navigate" },
    ];

    const nav = role === "ADMIN" ? adminNav : role === "STAFF" ? staffNav : clientNav;

    const actions: CommandItem[] = [
      { id: "logout", label: "Sign out", icon: LogOut, action: handleLogout, group: "Actions", keywords: ["logout", "exit"] },
    ];

    return [...nav, ...actions];
  }, [role, handleLogout]);

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = (it.label + " " + (it.keywords ?? []).join(" ")).toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  // Group filtered items
  const grouped = useMemo(() => {
    const out: Record<string, CommandItem[]> = {};
    for (const it of filtered) (out[it.group] ??= []).push(it);
    return out;
  }, [filtered]);

  // Reset active index on filter change
  useEffect(() => { setActive(0); }, [query]);

  function runItem(it: CommandItem) {
    onOpenChange(false);
    if (it.to) navigate(it.to);
    else if (it.action) it.action();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[active];
      if (it) runItem(it);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl ring-1 ring-gray-200 overflow-hidden"
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-2 px-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and actions…"
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Search"
            aria-controls="palette-list"
            aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
          />
          <kbd className="text-[10px] text-gray-400 font-mono">ESC</kbd>
        </div>

        <div id="palette-list" role="listbox" className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-500">No results for "{query}"</p>
          )}
          {Object.entries(grouped).map(([group, list]) => (
            <div key={group}>
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {group}
              </p>
              {list.map((it) => {
                const idx = filtered.indexOf(it);
                const isActive = idx === active;
                const Icon = it.icon;
                return (
                  <button
                    key={it.id}
                    id={`cmd-${it.id}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => runItem(it)}
                    onMouseEnter={() => setActive(idx)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                      isActive ? "bg-[#EAF3DE] text-[#3B6D11]" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-[#3B6D11]" : "text-gray-400"} />
                    <span className="flex-1">{it.label}</span>
                    {isActive && <ArrowRight size={13} className="text-[#3B6D11]" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-[10px] text-gray-500">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 rounded bg-white border border-gray-200 font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 rounded bg-white border border-gray-200 font-mono">↵</kbd> Open</span>
          </div>
          <span>BATC AgriSystem</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
