import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, CornerDownRight } from "lucide-react";
import { feedbackApi, ISSUE_TYPE_LABELS } from "@/features/feedback/api/feedback.api";
import { FeedbackForm } from "@/features/feedback/components/FeedbackForm";
import { distributionApi } from "@/features/distribution/api/distribution.api";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { MissingFarmerNotice } from "@/features/farmers/components/MissingFarmerNotice";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  NEW:          "bg-[#E6F1FB] text-[#0C447C]",
  ACKNOWLEDGED: "bg-[#FAEEDA] text-[#633806]",
  RESOLVED:     "bg-[#EAF3DE] text-[#27500A]",
};

export function ClientFeedbackPage() {
  const { data: myFarmer, isLoading: farmerLoading, isError: farmerError } = useQuery({
    queryKey: ["farmer-me"],
    queryFn: () => farmersApi.me(),
    retry: false,
  });

  const { data: distributions, isLoading: distsLoading } = useQuery({
    queryKey: ["distributions-mine"],
    queryFn: () => distributionApi.mine(),
    enabled: !!myFarmer,
  });

  const { data: myFeedback, isLoading: fbLoading } = useQuery({
    queryKey: ["feedback-mine"],
    queryFn: () => feedbackApi.list(),
    enabled: !!myFarmer,
  });

  const deliveredDists = distributions?.filter((d) => d.status === "DELIVERED") ?? [];
  const feedbackDistIds = new Set(
    (myFeedback?.results ?? []).map((f) => f.distribution).filter((d): d is number => d !== null),
  );

  const isLoading = farmerLoading || distsLoading || fbLoading;

  if (!farmerLoading && (farmerError || !myFarmer)) {
    return (
      <div className="p-4 md:p-0 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Feedback</p>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">Feedback</h2>
        </div>
        <MissingFarmerNotice
          description="Once your profile is linked you'll be able to send feedback and rate deliveries from here."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-0 space-y-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Card className="p-4 space-y-3">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Feedback</p>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">Feedback</h2>
        <p className="text-sm text-gray-500 mt-0.5">Rate deliveries and share your experience.</p>
      </div>

      {/* Desktop: side-by-side forms and history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: forms */}
        <div className="space-y-6">
          {/* Per-distribution feedback */}
          {deliveredDists.some((d) => !feedbackDistIds.has(d.id)) && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Rate a recent delivery
              </p>
              <div className="space-y-3">
                {deliveredDists.map((d) =>
                  feedbackDistIds.has(d.id) ? null : (
                    <div key={d.id}>
                      <p className="text-xs text-gray-500 mb-2">
                        {d.program_name} — Delivered{" "}
                        {d.delivered_at ? new Date(d.delivered_at).toLocaleDateString() : ""}
                      </p>
                      <FeedbackForm distributionId={d.id} />
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {/* General feedback */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Send general feedback
            </p>
            {deliveredDists.length === 0 && (
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                You haven't received a distribution yet. You can still send general feedback or report a
                concern below — our team will route it to the right person.
              </p>
            )}
            <FeedbackForm />
          </section>
        </div>

        {/* Right: history */}
        <div>
          {(myFeedback?.results.length ?? 0) > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                My feedback history
              </p>
              <div className="space-y-3">
                {myFeedback?.results.map((fb) => (
                  <Card key={fb.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-0.5" aria-label={`Rating: ${fb.rating} out of 5`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={fb.rating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                          />
                        ))}
                      </div>
                      <span className={cn("px-2 py-0.5 text-xs rounded font-medium", statusStyle[fb.status] ?? "bg-gray-100 text-gray-600")}>
                        {fb.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {ISSUE_TYPE_LABELS[fb.issue_type]}
                      {fb.program_name && ` · ${fb.program_name}`}
                    </p>
                    {fb.comment && <p className="text-sm text-gray-700">{fb.comment}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(fb.created_at).toLocaleDateString()}
                    </p>

                    {/* Staff/admin replies */}
                    {fb.replies && fb.replies.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight size={11} className="text-[#3B6D11]" />
                          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                            BATC reply{fb.replies.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        {fb.replies.map((r) => (
                          <div key={r.id} className="bg-[#F7FAF3] border border-[#D6E8BF] rounded-md px-2.5 py-1.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[11px] font-semibold text-[#27500A]">{r.author_name}</p>
                              <span className="text-[10px] text-gray-400 tabular-nums">
                                {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-800 leading-relaxed mt-0.5 whitespace-pre-wrap">
                              {r.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Friendly empty hint */}
          {(myFeedback?.results.length ?? 0) === 0 && deliveredDists.length === 0 && (
            <Card>
              <EmptyState
                compact
                icon={<MessageSquare size={18} />}
                title="No feedback history yet"
                description="Once you send feedback or rate a delivery, it'll appear here."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
