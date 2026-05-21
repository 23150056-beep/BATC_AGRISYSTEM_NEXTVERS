import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { distributionApi } from "@/features/distribution/api/distribution.api";
import { DistributionStatusBadge } from "@/features/distribution/components/DistributionStatusBadge";
import { farmersApi } from "@/features/farmers/api/farmers.api";
import { MissingFarmerNotice } from "@/features/farmers/components/MissingFarmerNotice";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";
import { CheckCircle2, Package } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";

export function ClientClaimsPage() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

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

  const isLoading = farmerLoading || distsLoading;

  if (!farmerLoading && (farmerError || !myFarmer)) {
    return (
      <div className="p-4 md:p-0 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Claims</p>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">My Claims</h2>
        </div>
        <MissingFarmerNotice
          description="Once your profile is linked, your distributions and pickup schedule will appear here."
        />
      </div>
    );
  }

  const confirmMutation = useMutation({
    mutationFn: (id: number) => distributionApi.confirmReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["distributions-mine"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-mine"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-usage"] });
      setConfirmingId(null);
      toast.success("Receipt confirmed. Salamat!");
    },
    onError: (err) => {
      const status = (err as any)?.response?.status;
      if (status === 404) {
        toast.error("This distribution is no longer available. Refresh the page to see your latest claims.");
        queryClient.invalidateQueries({ queryKey: ["distributions-mine"] });
        return;
      }
      toast.error(getApiErrorMessage(err, "Could not confirm receipt. Please try again."));
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-0 space-y-3">
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-0 space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Claims</p>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">My Claims</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your distribution pickups and delivery status.</p>
      </div>

      {!distributions?.length ? (
        <Card>
          <EmptyState
            compact
            icon={<Package size={20} />}
            title="No distributions yet"
            description="Apply for a program to see your claims here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {distributions.map((dist) => (
            <Card key={dist.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm truncate">{dist.program_name}</p>
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
                      <span className="font-medium tabular-nums">
                        {Number(item.quantity_planned)} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {dist.remarks && (
                <p className="text-xs text-gray-500 italic">{dist.remarks}</p>
              )}

              {(dist.status === "SCHEDULED" || dist.status === "RESCHEDULED" || dist.status === "DELAYED") && (
                <div className="pt-3 border-t border-gray-100">
                  {confirmingId === dist.id ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-green-800 font-medium">
                        Confirm that you have physically received the items listed above?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          leftIcon={<CheckCircle2 size={13} />}
                          loading={confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate(dist.id)}
                        >
                          Yes, I received it
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setConfirmingId(null)}
                        >
                          Cancel
                        </Button>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
