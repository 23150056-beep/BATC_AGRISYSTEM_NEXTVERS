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
    <div className="flex h-screen overflow-hidden">
      <aside
        className="flex flex-col items-center py-3 gap-1 border-r border-gray-200 bg-white"
        style={{ width: 44, minWidth: 44 }}
      >
        {navItems.map(({ to, icon: Icon, label, alertKey }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                "relative p-2.5 rounded-md transition-colors",
                isActive
                  ? "bg-[#EAF3DE] text-[#3B6D11]"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
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
          className="p-2.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-11 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          <span className="text-sm text-gray-600 font-medium">{breadcrumb || "Staff Portal"}</span>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto p-5 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
