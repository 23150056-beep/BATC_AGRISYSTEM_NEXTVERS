import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Truck, CheckCircle, Clock } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";

const ACCENT = {
  green: { bar: "#22c55e", glow: "rgba(34, 197, 94, 0.22)",  icon: "rgba(34, 197, 94, 0.18)",  iconColor: "#86efac" },
  amber: { bar: "#f59e0b", glow: "rgba(245, 158, 11, 0.20)", icon: "rgba(245, 158, 11, 0.16)", iconColor: "#fcd34d" },
  blue:  { bar: "#3b82f6", glow: "rgba(59, 130, 246, 0.18)", icon: "rgba(59, 130, 246, 0.14)", iconColor: "#93c5fd" },
  teal:  { bar: "#14b8a6", glow: "rgba(20, 184, 166, 0.20)", icon: "rgba(20, 184, 166, 0.16)", iconColor: "#5eead4" },
};

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: {
  label: string; value: number; icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "teal"; sublabel?: string;
}) {
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

export default function StaffDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-staff"],
    queryFn: () => dashboardApi.staff(),
    refetchInterval: 60_000,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements", "STAFF"],
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
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Pending Applications"
            value={data?.pending_applications ?? 0}
            icon={ClipboardList}
            accent={data?.pending_applications ? "amber" : "green"}
            sublabel="Need review"
          />
          <StatCard
            label="Today's Distributions"
            value={data?.distributions_today ?? 0}
            icon={Truck}
            accent="teal"
            sublabel="Total scheduled"
          />
          <StatCard
            label="Scheduled"
            value={data?.scheduled_today ?? 0}
            icon={Clock}
            accent="blue"
            sublabel="Awaiting delivery"
          />
          <StatCard
            label="Delivered Today"
            value={data?.delivered_today ?? 0}
            icon={CheckCircle}
            accent="green"
            sublabel="Completed"
          />
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3">Announcements</h2>
        <div className="space-y-3">
          {announcements?.results.slice(0, 5).map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
          {!announcements?.results.length && (
            <p className="text-sm italic">No announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
}
