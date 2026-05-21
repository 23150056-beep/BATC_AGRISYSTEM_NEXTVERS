import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Truck, CheckCircle, Clock, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { EmptyState, Skeleton, Card } from "@/components/ui";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const ACCENT = {
  green: "bg-[#EAF3DE] text-[#3B6D11]",
  amber: "bg-amber-50  text-amber-700",
  blue:  "bg-[#E6F1FB] text-[#0C447C]",
  navy:  "bg-[#162036]/8 text-[#162036]",
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accent?: keyof typeof ACCENT;
  sublabel?: string;
  to?: string;
}

function StatCard({ label, value, icon: Icon, accent = "green", sublabel, to }: StatCardProps) {
  const content = (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all group">
      <div className="flex items-center gap-2.5">
        <div className={cn("p-2 rounded-md shrink-0", ACCENT[accent])} aria-hidden="true">
          <Icon size={16} strokeWidth={2} />
        </div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex-1 truncate">{label}</p>
        {to && (
          <ArrowUpRight
            size={12}
            className="text-gray-300 group-hover:text-[var(--color-brand-600)] transition-colors shrink-0"
          />
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
      </div>
      {sublabel && <p className="text-[10px] text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)]/40">
      {content}
    </Link>
  ) : (
    <div>{content}</div>
  );
}

export default function StaffDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-staff"],
    queryFn: () => dashboardApi.staff(),
    refetchInterval: 60_000,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements", "STAFF"],
    queryFn: () => announcementsApi.list(),
  });

  const today = useMemo(
    () => new Date().toLocaleDateString("en-PH", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }),
    [],
  );

  const greetingName = useMemo(() => {
    const fn = user?.first_name?.trim();
    if (fn) return fn;
    if (user?.username) return user.username;
    return "there";
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header — matches admin pattern */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">
            Staff · Overview
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight mt-1">
            Welcome back, {greetingName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{today}</p>
        </div>
      </header>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[96px] rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Pending Applications"
            value={data?.pending_applications ?? 0}
            icon={ClipboardList}
            accent={data?.pending_applications ? "amber" : "green"}
            sublabel="Need review"
            to="/staff/applications"
          />
          <StatCard
            label="Today's Distributions"
            value={data?.distributions_today ?? 0}
            icon={Truck}
            accent="navy"
            sublabel="Total scheduled"
            to="/staff/distribution"
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

      {/* Announcements */}
      <section aria-labelledby="staff-announcements">
        <h2 id="staff-announcements" className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Announcements
        </h2>
        <div className="space-y-3">
          {announcements?.results.slice(0, 5).map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
          {!announcements?.results.length && (
            <Card>
              <EmptyState
                compact
                title="No announcements"
                description="You're all caught up. Check back later for updates from admin."
              />
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
