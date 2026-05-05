import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "teal" | "red";
  sublabel?: string;
}

const ACCENT = {
  green: { bar: "#22c55e", glow: "rgba(34, 197, 94, 0.22)",  icon: "rgba(34, 197, 94, 0.18)",  iconColor: "#86efac" },
  amber: { bar: "#f59e0b", glow: "rgba(245, 158, 11, 0.20)", icon: "rgba(245, 158, 11, 0.16)", iconColor: "#fcd34d" },
  blue:  { bar: "#3b82f6", glow: "rgba(59, 130, 246, 0.18)", icon: "rgba(59, 130, 246, 0.14)", iconColor: "#93c5fd" },
  teal:  { bar: "#14b8a6", glow: "rgba(20, 184, 166, 0.20)", icon: "rgba(20, 184, 166, 0.16)", iconColor: "#5eead4" },
  red:   { bar: "#ef4444", glow: "rgba(239, 68, 68,  0.20)", icon: "rgba(239, 68, 68,  0.14)", iconColor: "#fca5a5" },
};

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: StatCardProps) {
  const { bar, glow, icon: iconBg, iconColor } = ACCENT[accent];
  return (
    <div
      className="border rounded-xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden"
      style={{ borderColor: `rgba(255,255,255,0.14)` }}
    >
      {/* Colored top accent bar */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: bar, opacity: 0.85 }} />
      {/* Subtle glow tint from accent */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 60% at 20% 50%, ${glow} 0%, transparent 70%)` }} />

      <div className="relative p-3 rounded-xl shrink-0" style={{ background: iconBg }}>
        <Icon size={22} style={{ color: iconColor }} />
      </div>

      <div className="relative">
        <p className="text-3xl font-bold leading-none" style={{ color: "rgba(242,255,247,0.99)" }}>{value}</p>
        <p className="text-sm mt-1.5 font-medium" style={{ color: "rgba(200,240,218,0.95)" }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: "rgba(185,228,205,0.82)" }}>{sublabel}</p>}
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-admin"],
    queryFn: () => dashboardApi.admin(),
    refetchInterval: 60_000,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements", "ADMIN"],
    queryFn: () => announcementsApi.list(),
  });

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(185, 228, 205, 0.85)" }}>{today}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Total Farmers"        value={data?.total_farmers ?? 0}       icon={Users}         accent="green" />
          <StatCard label="Active Programs"       value={data?.active_programs ?? 0}     icon={ClipboardList} accent="blue"  />
          <StatCard
            label="Pending Applications"
            value={data?.pending_applications ?? 0}
            icon={ClipboardList}
            accent={data?.pending_applications ? "amber" : "green"}
            sublabel="Awaiting review"
          />
          <StatCard
            label="Distributions Today"
            value={data?.distributions_today ?? 0}
            icon={Truck}
            accent="teal"
            sublabel="Scheduled for today"
          />
          <StatCard
            label="Low-Stock Items"
            value={data?.low_stock_items ?? 0}
            icon={AlertTriangle}
            accent={data?.low_stock_items ? "red" : "green"}
            sublabel="Below threshold"
          />
          <StatCard
            label="Fulfilled"
            value={data?.fulfilled_applications ?? 0}
            icon={CheckCircle}
            accent="green"
            sublabel="Applications completed"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold mb-3">Recent Announcements</h2>
          <div className="space-y-3">
            {announcements?.results.slice(0, 3).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} showAudience />
            ))}
            {!announcements?.results.length && (
              <p className="text-sm italic">No announcements yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Quick Stats</h2>
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: "Total distributions",    value: data?.total_distributions   ?? 0 },
                  { label: "Fulfilled applications",  value: data?.fulfilled_applications ?? 0 },
                  { label: "Active programs",         value: data?.active_programs        ?? 0 },
                ].map(({ label, value }, i) => (
                  <tr key={label} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                    <td className="px-5 py-3.5" style={{ color: "rgba(200,240,218,0.92)" }}>{label}</td>
                    <td className="px-5 py-3.5 text-right font-bold" style={{ color: "rgba(242,255,247,0.99)" }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
