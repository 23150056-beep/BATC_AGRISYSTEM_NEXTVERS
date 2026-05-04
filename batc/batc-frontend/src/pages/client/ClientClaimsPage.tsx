import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { distributionApi } from "@/features/distribution/api/distribution.api";
import { DistributionStatusBadge } from "@/features/distribution/components/DistributionStatusBadge";
import { CheckCircle2 } from "lucide-react";

export function ClientClaimsPage() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const { data: distributions, isLoading } = useQuery({
    queryKey: ["distributions-mine"],
    queryFn: () => distributionApi.mine(),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => distributionApi.confirmReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions-mine"] });
      setConfirmingId(null);
      toast.success("Receipt confirmed. Salamat!");
    },
    // Surface the failure instead of silently closing the panel (Finding #30)
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      toast.error(detail ?? "Could not confirm receipt. Please try again.");
      // keep the inline confirm panel open so the user can retry
    },
  });

  if (isLoading) return <div className="p-4 text-gray-400">Loading…</div>;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">My Claims</h2>
      {distributions?.length === 0 && (
        <p className="text-sm text-gray-400 italic">No distributions yet. Apply for a program first.</p>
      )}
      {distributions?.map((dist) => (
        <div key={dist.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{dist.program_name}</p>
              <p className="text-xs text-gray-400 font-mono">{dist.program_code}</p>
            </div>
            <DistributionStatusBadge status={dist.status} />
          </div>

          {dist.scheduled_date && (
            <p className="text-xs text-gray-500">Scheduled: {dist.scheduled_date}</p>
          )}
          {dist.delivered_at && (
            <p className="text-xs text-gray-500">
              Delivered: {new Date(dist.delivered_at).toLocaleDateString()}
            </p>
          )}

          {dist.items.length > 0 && (
            <div className="pt-2 border-t border-gray-100 space-y-1">
              {dist.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-gray-600">
                  <span>
                    {item.item_name}{" "}
                    <span className="text-gray-400">(Lot: {item.lot_number})</span>
                  </span>
                  <span className="font-medium">
                    {Number(item.quantity_planned)} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {dist.remarks && (
            <p className="text-xs text-gray-500 italic">{dist.remarks}</p>
          )}

          {/* Confirm Receipt — only when still pending delivery */}
          {(dist.status === "SCHEDULED" || dist.status === "RESCHEDULED" || dist.status === "DELAYED") && (
            <div className="pt-3 border-t border-gray-100">
              {confirmingId === dist.id ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-green-800 font-medium">
                    Confirm that you have physically received the items listed above?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmMutation.mutate(dist.id)}
                      disabled={confirmMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle2 size={13} />
                      {confirmMutation.isPending ? "Confirming…" : "Yes, I received it"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(dist.id)}
                  className="flex items-center gap-1.5 text-xs text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md font-medium transition-colors"
                >
                  <CheckCircle2 size={13} />
                  Confirm Receipt
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
