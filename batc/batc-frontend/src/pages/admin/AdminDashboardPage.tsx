import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "navy" | "red";
  sublabel?: string;
}

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: StatCardProps) {
  const colors = {
    green: "bg-[#EAF3DE] text-[#3B6D11]",
    amber: "bg-amber-50 text-amber-700",
    blue:  "bg-[#E6F1FB] text-[#0C447C]",
    navy:  "bg-[#162036]/10 text-[#162036]",
    red:   "bg-red-50 text-red-700",
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
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">{today}</p>
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
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Announcements</h2>
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
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: "Total distributions", value: data?.total_distributions ?? 0 },
                  { label: "Fulfilled applications", value: data?.fulfilled_applications ?? 0 },
                  { label: "Active programs", value: data?.active_programs ?? 0 },
                ].map(({ label, value }) => (
                  <tr key={label}>
                    <td className="px-4 py-3 text-gray-600">{label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{value}</td>
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
