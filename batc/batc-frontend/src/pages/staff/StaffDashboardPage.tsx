import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Truck, CheckCircle, Clock } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { cn } from "@/lib/utils";

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: {
  label: string; value: number; icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "navy"; sublabel?: string;
}) {
  const colors = {
    green: "bg-[#EAF3DE] text-[#3B6D11]",
    amber: "bg-amber-50 text-amber-700",
    blue:  "bg-[#E6F1FB] text-[#0C447C]",
    navy:  "bg-[#162036]/10 text-[#162036]",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={cn("p-3 rounded-lg shrink-0", colors[accent])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
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
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">{today}</p>
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
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Announcements</h2>
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
