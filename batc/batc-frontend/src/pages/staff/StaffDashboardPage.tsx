import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Truck, CheckCircle, Clock } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";


function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: {
  label: string; value: number; icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "navy"; sublabel?: string;
}) {
  const iconColors = {
    green: { bg: "rgba(52, 168, 83, 0.14)",  color: "#2d6a4f" },
    amber: { bg: "rgba(212, 160, 23, 0.14)", color: "#b45309" },
    blue:  { bg: "rgba(12, 68, 124, 0.12)",  color: "#0c447c" },
    navy:  { bg: "rgba(27, 67, 50, 0.12)",   color: "#1b4332" },
  };
  const { bg, color } = iconColors[accent];
  return (
    <div className="border rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className="p-3 rounded-lg shrink-0" style={{ background: bg, color }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none" style={{ color: "#1a3d27" }}>{value}</p>
        <p className="text-sm mt-1" style={{ color: "rgba(30, 70, 45, 0.75)" }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: "rgba(30, 70, 45, 0.50)" }}>{sublabel}</p>}
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

  // Key includes role so the STAFF cache never bleeds into other role caches
  const { data: announcements } = useQuery({
    queryKey: ["announcements", "STAFF"],
    queryFn: () => announcementsApi.list(),
  });

  const today = new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm" style={{ color: "rgba(30, 70, 45, 0.55)" }}>{today}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-24 animate-pulse" />
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
            <p className="text-sm text-gray-400 italic">No announcements.</p>
          )}
        </div>
      </div>
    </div>
  );
}
