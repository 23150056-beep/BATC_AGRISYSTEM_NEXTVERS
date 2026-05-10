import { useQuery } from "@tanstack/react-query";
import { Calendar, Megaphone, ArrowRight, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { distributionApi } from "@/features/distribution/api/distribution.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { DistributionStatusBadge } from "@/features/distribution/components/DistributionStatusBadge";
import { useAuthStore } from "@/stores/authStore";
import { Card, EmptyState, Skeleton } from "@/components/ui";

export function ClientHomePage() {
  const { user } = useAuthStore();

  const { data: announcements, isLoading: annsLoading } = useQuery({
    queryKey: ["announcements", "CLIENT"],
    queryFn: () => announcementsApi.list(),
  });

  const { data: distributions, isLoading: distLoading } = useQuery({
    queryKey: ["distributions-mine"],
    queryFn: () => distributionApi.mine(),
  });

  const nextDist = distributions?.find((d) => d.status === "SCHEDULED" || d.status === "DELAYED");
  const firstName = user?.first_name ?? "Farmer";

  return (
    <div className="p-4 space-y-5">
      {/* Welcome banner */}
      <div
        className="rounded-xl p-4 text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0" aria-hidden="true">
            <Sprout size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">Welcome back</p>
            <p className="text-base font-semibold truncate">{firstName}</p>
          </div>
        </div>
      </div>

      {/* Next distribution */}
      {distLoading ? (
        <Card className="p-4">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-3/4 mb-1.5" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      ) : nextDist ? (
        <Card className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar size={12} className="text-gray-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Next Distribution</p>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{nextDist.program_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {nextDist.scheduled_date ? `Scheduled · ${nextDist.scheduled_date}` : "Date to be confirmed"}
              </p>
            </div>
            <DistributionStatusBadge status={nextDist.status} />
          </div>
          {nextDist.remarks && (
            <p className="text-xs text-gray-500 mt-2.5 pt-2.5 border-t border-gray-100 italic">
              {nextDist.remarks}
            </p>
          )}
        </Card>
      ) : null}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/app/programs"
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-[var(--color-brand-500)]/40 hover:shadow-sm transition-all group"
        >
          <p className="text-sm font-semibold text-gray-900">Browse programs</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            See what you qualify for
            <ArrowRight size={11} className="text-gray-400 group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-600)] transition-all" />
          </p>
        </Link>
        <Link
          to="/app/applications"
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-[var(--color-brand-500)]/40 hover:shadow-sm transition-all group"
        >
          <p className="text-sm font-semibold text-gray-900">My applications</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            Track submission status
            <ArrowRight size={11} className="text-gray-400 group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-600)] transition-all" />
          </p>
        </Link>
      </div>

      {/* Announcements */}
      <section aria-labelledby="client-announcements" className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Megaphone size={12} className="text-gray-400" />
          <h2 id="client-announcements" className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
            Announcements
          </h2>
        </div>
        {annsLoading ? (
          <Card className="p-4 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </Card>
        ) : !announcements?.results.length ? (
          <Card>
            <EmptyState
              compact
              icon={<Megaphone size={18} />}
              title="No announcements"
              description="Check back soon for updates from BATC."
            />
          </Card>
        ) : (
          announcements.results.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
        )}
      </section>
    </div>
  );
}
