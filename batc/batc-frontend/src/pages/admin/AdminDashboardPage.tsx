import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardList, Truck, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { Card, CardHeader, CardTitle, CardBody, EmptyState, SkeletonStat, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: "green" | "amber" | "blue" | "navy" | "red";
  sublabel?: string;
  to?: string;
  trend?: { value: number; label?: string };
}

const ACCENT = {
  green: "bg-[#EAF3DE] text-[#3B6D11]",
  amber: "bg-amber-50  text-amber-700",
  blue:  "bg-[#E6F1FB] text-[#0C447C]",
  navy:  "bg-[#162036]/8 text-[#162036]",
  red:   "bg-red-50    text-red-700",
};

function StatCard({ label, value, icon: Icon, accent = "green", sublabel, to, trend }: StatCardProps) {
  const content = (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group">
      <div className={cn("p-3 rounded-lg shrink-0", ACCENT[accent])} aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                trend.value >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.value >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      {to && (
        <ArrowUpRight
          size={14}
          className="text-gray-300 group-hover:text-[var(--color-brand-600)] transition-colors shrink-0"
        />
      )}
    </div>
  );
  return to ? (
    <Link to={to} aria-label={`${label}: ${value}. View details.`} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40">
      {content}
    </Link>
  ) : (
    <div role="group" aria-label={`${label}: ${value}`}>{content}</div>
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
      <PageHeader
        title="Welcome back"
        description={today}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard label="Total Farmers"        value={data?.total_farmers ?? 0}       icon={Users}         accent="green" to="/admin/farmers" />
          <StatCard label="Active Programs"      value={data?.active_programs ?? 0}     icon={ClipboardList} accent="blue"  to="/admin/programs" />
          <StatCard
            label="Pending Applications"
            value={data?.pending_applications ?? 0}
            icon={ClipboardList}
            accent={data?.pending_applications ? "amber" : "green"}
            sublabel="Awaiting review"
            to="/admin/applications"
          />
          <StatCard
            label="Distributions Today"
            value={data?.distributions_today ?? 0}
            icon={Truck}
            accent="navy"
            sublabel="Scheduled for today"
            to="/admin/distribution"
          />
          <StatCard
            label="Low-Stock Items"
            value={data?.low_stock_items ?? 0}
            icon={AlertTriangle}
            accent={data?.low_stock_items ? "red" : "green"}
            sublabel="Below threshold"
            to="/admin/inventory"
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
        <section aria-labelledby="recent-announcements-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="recent-announcements-heading" className="text-sm font-semibold text-gray-700">Recent Announcements</h2>
            <Link
              to="/admin/announcements"
              className="text-xs font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-0.5"
            >
              Manage <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="space-y-3">
            {announcements?.results.slice(0, 3).map((a) => (
              <AnnouncementCard key={a.id} announcement={a} showAudience />
            ))}
            {!announcements?.results.length && (
              <Card>
                <EmptyState
                  compact
                  title="No announcements yet"
                  description="Create your first announcement to keep farmers and staff informed."
                />
              </Card>
            )}
          </div>
        </section>

        <section aria-labelledby="quick-stats-heading">
          <h2 id="quick-stats-heading" className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h2>
          <Card>
            <CardHeader>
              <CardTitle>System totals</CardTitle>
            </CardHeader>
            <CardBody className="!p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: "Total distributions",    value: data?.total_distributions   ?? 0 },
                    { label: "Fulfilled applications", value: data?.fulfilled_applications ?? 0 },
                    { label: "Active programs",        value: data?.active_programs        ?? 0 },
                  ].map(({ label, value }) => (
                    <tr key={label} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-600">{label}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900 tabular-nums">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}
