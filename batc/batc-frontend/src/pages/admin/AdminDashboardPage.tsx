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

const ACCENT = {
  green: { bar: "#40916c", icon: "rgba(64, 145, 108, 0.14)", iconColor: "#2d6a4f" },
  amber: { bar: "#d4a017", icon: "rgba(212, 160, 23, 0.14)", iconColor: "#b45309" },
  blue:  { bar: "#2563eb", icon: "rgba(37,  99, 235, 0.12)", iconColor: "#1d4ed8" },
  navy:  { bar: "#1b4332", icon: "rgba(27,  67, 50,  0.13)", iconColor: "#1b4332" },
  red:   { bar: "#dc2626", icon: "rgba(220, 38, 38,  0.12)", iconColor: "#b91c1c" },
};

function StatCard({ label, value, icon: Icon, accent = "green", sublabel }: StatCardProps) {
  const { bar, icon: iconBg, iconColor } = ACCENT[accent];
  return (
    <div
      className="border rounded-xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden"
      style={{ borderTop: `3px solid ${bar}` }}
    >
      {/* Subtle background tint matching accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${bar}08 0%, transparent 60%)` }}
      />
      <div
        className="p-3 rounded-xl shrink-0 relative"
        style={{ background: iconBg, color: iconColor }}
      >
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
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(45, 106, 79, 0.60)" }}>{today}</p>
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
              <p className="text-sm italic" style={{ color: "rgba(45, 106, 79, 0.50)" }}>No announcements yet.</p>
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
                  <tr
                    key={label}
                    style={{ borderTop: i > 0 ? "1px solid rgba(64, 145, 108, 0.10)" : "none" }}
                  >
                    <td className="px-5 py-3.5" style={{ color: "rgba(45, 106, 79, 0.75)" }}>{label}</td>
                    <td className="px-5 py-3.5 text-right font-bold" style={{ color: "#14362a" }}>{value}</td>
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
