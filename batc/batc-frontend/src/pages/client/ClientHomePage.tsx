import { useQuery } from "@tanstack/react-query";
import { announcementsApi } from "@/features/announcements/api/announcements.api";
import { distributionApi } from "@/features/distribution/api/distribution.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { DistributionStatusBadge } from "@/features/distribution/components/DistributionStatusBadge";

export function ClientHomePage() {
  // Key includes role so the CLIENT cache never bleeds into other role caches
  const { data: announcements } = useQuery({
    queryKey: ["announcements", "CLIENT"],
    queryFn: () => announcementsApi.list(),
  });

  const { data: distributions } = useQuery({
    queryKey: ["distributions-mine"],
    queryFn: () => distributionApi.mine(),
  });

  const nextDist = distributions?.find((d) => d.status === "SCHEDULED" || d.status === "DELAYED");

  return (
    <div className="p-4 space-y-5">
      {nextDist && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Next Distribution</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{nextDist.program_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {nextDist.scheduled_date ? `Scheduled: ${nextDist.scheduled_date}` : "Date TBD"}
              </p>
            </div>
            <DistributionStatusBadge status={nextDist.status} />
          </div>
          {nextDist.remarks && (
            <p className="text-xs text-gray-500 mt-2 italic">{nextDist.remarks}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Announcements</h2>
        {!announcements?.results.length && (
          <p className="text-sm text-gray-400 italic">No announcements at this time.</p>
        )}
        {announcements?.results.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    </div>
  );
}
