import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Truck, CheckCircle, Clock } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";

const ACCENT = {
  green: { bar: "#40916c", icon: "rgba(64, 145, 108, 0.14)", iconColor: "#2d6a4f" },
  amber: { bar: "#d4a017", icon: "rgba(212, 160, 23, 0.14)", iconColor: "#b45309" },
  blue:  { bar: "#2563eb", icon: "rgba(37,  99, 235, 0.12)", iconColor: "#1d4ed8" },
  navy:  { bar: "#1b4332", icon: "rgba(27,  67, 50,  0.13)", iconColor: "#1b4332" },
};

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: {
  label: string; value: number; icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "navy"; sublabel?: string;
}) {
  const { bar, icon: iconBg, iconColor } = ACCENT[accent];
  return (
    <div
      className="border rounded-xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden"
      style={{ borderTop: `3px solid ${bar}` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${bar}08 0%, transparent 60%)` }}
      />
      <div className="p-3 rounded-xl shrink-0 relative" style={{ background: iconBg, color: iconColor }}>
        <Icon size={20} />
      </div>
      <div className="relative">
        <p className="text-2xl font-bold leading-none" style={{ color: "#14362a" }}>{value}</p>
        <p className="text-sm mt-1 font-medium" style={{ color: "#2d6a4f" }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: "rgba(45, 106, 79, 0.60)" }}>{sublabel}</p>}
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
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(45, 106, 79, 0.60)" }}>{today}</p>
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
            accent="navy"
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
            <p className="text-sm italic" style={{ color: "rgba(45, 106, 79, 0.50)" }}>No announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
}
