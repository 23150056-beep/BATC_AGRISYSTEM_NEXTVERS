import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare } from "lucide-react";
import { feedbackApi } from "@/features/feedback/api/feedback.api";
import { FeedbackForm } from "@/features/feedback/components/FeedbackForm";
import { distributionApi } from "@/features/distribution/api/distribution.api";
import { Card, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const statusStyle: Record<string, string> = {
  NEW:          "bg-[#E6F1FB] text-[#0C447C]",
  ACKNOWLEDGED: "bg-[#FAEEDA] text-[#633806]",
  RESOLVED:     "bg-[#EAF3DE] text-[#27500A]",
};

export function ClientFeedbackPage() {
  const { data: distributions, isLoading: distsLoading } = useQuery({
    queryKey: ["distributions-mine"],
    queryFn: () => distributionApi.mine(),
  });

  const { data: myFeedback, isLoading: fbLoading } = useQuery({
    queryKey: ["feedback-mine"],
    queryFn: () => feedbackApi.list(),
  });

  const deliveredDists = distributions?.filter((d) => d.status === "DELIVERED") ?? [];
  const feedbackDistIds = new Set(myFeedback?.results.map((f) => f.distribution));

  const isLoading = distsLoading || fbLoading;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
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
    <div className="p-4 space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Feedback</h2>

      {/* Submit new feedback */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Submit Feedback
        </p>
        {deliveredDists.length > 0 ? (
          <div className="space-y-3">
            {deliveredDists.map((d) => (
              <div key={d.id}>
                <p className="text-xs text-gray-500 mb-2">
                  {d.program_name} — Delivered{" "}
                  {d.delivered_at ? new Date(d.delivered_at).toLocaleDateString() : ""}
                </p>
                {feedbackDistIds.has(d.id) ? (
                  <p className="text-xs text-gray-400 italic px-1">
                    Feedback already submitted for this distribution.
                  </p>
                ) : (
                  <FeedbackForm distributionId={d.id} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              compact
              icon={<MessageSquare size={18} />}
              title="No deliveries to rate yet"
              description="Once you receive a distribution, you'll be able to leave feedback here."
            />
          </Card>
        )}
      </section>

      {/* Feedback history */}
      {(myFeedback?.results.length ?? 0) > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            My Feedback History
          </p>
          <div className="space-y-3">
            {myFeedback?.results.map((fb) => (
              <Card key={fb.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
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
                {fb.comment && <p className="text-sm text-gray-700">{fb.comment}</p>}
                <p className="text-xs text-gray-400">
                  {new Date(fb.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
