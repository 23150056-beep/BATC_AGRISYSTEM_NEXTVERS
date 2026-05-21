import { useQuery } from "@tanstack/react-query";
import { Calendar, Megaphone, ArrowRight, Sprout, ClipboardList, FileCheck, Package, MessageSquare } from "lucide-react";
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
    <div className="p-4 md:p-0 space-y-5">
      {/* Welcome banner */}
      <div
        className="rounded-xl p-4 md:p-5 text-white shadow-sm"
        style={{
          background: "linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0" aria-hidden="true">
            <Sprout size={18} className="md:hidden" />
            <Sprout size={22} className="hidden md:block" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">Welcome back</p>
            <p className="text-base md:text-lg font-semibold truncate">{firstName}</p>
          </div>
        </div>
      </div>

      {/* Desktop: two-column layout for quick info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar size={12} className="text-gray-400" />
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Next Distribution</p>
            </div>
            <p className="text-sm text-gray-500">No upcoming distributions scheduled.</p>
          </Card>
        )}

        {/* Quick stats card (desktop only) */}
        <Card className="hidden md:block p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Package size={12} className="text-gray-400" />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Quick Summary</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-brand-100)] rounded-lg px-3 py-2.5">
              <p className="text-lg font-bold text-[var(--color-brand-600)] tabular-nums">
                {distributions?.filter((d) => d.status === "DELIVERED").length ?? 0}
              </p>
              <p className="text-[11px] text-[var(--color-brand-600)]/70">Delivered</p>
            </div>
            <div className="bg-amber-50 rounded-lg px-3 py-2.5">
              <p className="text-lg font-bold text-amber-700 tabular-nums">
                {distributions?.filter((d) => d.status === "SCHEDULED" || d.status === "RESCHEDULED").length ?? 0}
              </p>
              <p className="text-[11px] text-amber-700/70">Scheduled</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          to="/app/programs"
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-[var(--color-brand-500)]/40 hover:shadow-sm transition-all group"
        >
          <div className="hidden md:flex w-8 h-8 rounded-lg bg-[var(--color-brand-100)] items-center justify-center mb-2">
            <ClipboardList size={14} className="text-[var(--color-brand-600)]" />
          </div>
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
          <div className="hidden md:flex w-8 h-8 rounded-lg bg-[var(--color-info-soft)] items-center justify-center mb-2">
            <FileCheck size={14} className="text-[var(--color-info)]" />
          </div>
          <p className="text-sm font-semibold text-gray-900">My applications</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            Track submission status
            <ArrowRight size={11} className="text-gray-400 group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-600)] transition-all" />
          </p>
        </Link>
        <Link
          to="/app/claims"
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-[var(--color-brand-500)]/40 hover:shadow-sm transition-all group"
        >
          <div className="hidden md:flex w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mb-2">
            <Package size={14} className="text-amber-700" />
          </div>
          <p className="text-sm font-semibold text-gray-900">My claims</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            View pickup schedule
            <ArrowRight size={11} className="text-gray-400 group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-600)] transition-all" />
          </p>
        </Link>
        <Link
          to="/app/feedback"
          className="bg-white border border-gray-200 rounded-xl p-3 hover:border-[var(--color-brand-500)]/40 hover:shadow-sm transition-all group"
        >
          <div className="hidden md:flex w-8 h-8 rounded-lg bg-[var(--color-success-soft)] items-center justify-center mb-2">
            <MessageSquare size={14} className="text-[var(--color-success)]" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Send feedback</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            Rate deliveries
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.results.map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
          </div>
        )}
      </section>
    </div>
  );
}
