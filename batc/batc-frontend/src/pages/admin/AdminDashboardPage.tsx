import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";


interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "navy" | "red";
  sublabel?: string;
}

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: StatCardProps) {
  const iconColors = {
    green: { bg: "rgba(52, 168, 83, 0.14)",  color: "#2d6a4f" },
    amber: { bg: "rgba(212, 160, 23, 0.14)", color: "#b45309" },
    blue:  { bg: "rgba(12, 68, 124, 0.12)",  color: "#0c447c" },
    navy:  { bg: "rgba(27, 67, 50, 0.12)",   color: "#1b4332" },
    red:   { bg: "rgba(180, 35, 24, 0.12)",  color: "#b42318" },
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

  const today = new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm" style={{ color: "rgba(30, 70, 45, 0.55)" }}>{today}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Total Farmers" value={data?.total_farmers ?? 0} icon={Users} accent="green" />
          <StatCard label="Active Programs" value={data?.active_programs ?? 0} icon={ClipboardList} accent="blue" />
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
            accent="navy"
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
              <p className="text-sm text-gray-400 italic">No announcements yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Quick Stats</h2>
          <div className="border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.40)" }}>
                {[
                  { label: "Total distributions", value: data?.total_distributions ?? 0 },
                  { label: "Fulfilled applications", value: data?.fulfilled_applications ?? 0 },
                  { label: "Active programs", value: data?.active_programs ?? 0 },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="px-4 py-3" style={{ color: "rgba(30, 70, 45, 0.72)" }}>{label}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "#1a3d27" }}>{value}</td>
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
