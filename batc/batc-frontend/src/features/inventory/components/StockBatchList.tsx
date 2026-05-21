import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, AlertTriangle, Settings2 } from "lucide-react";
import { inventoryApi, type StockBatch } from "../api/inventory.api";
import { AdjustStockDialog } from "./AdjustStockDialog";
import { Button, Skeleton, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props {
  itemId: number;
  isAdmin: boolean;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Narrow-drawer-friendly batch list — replaces the previous 5-column table
 * which was clipped inside the 384px detail panel. Each batch is a card with
 * Lot · current qty on top, and Received / Expiry / actions stacked below.
 */
export function StockBatchList({ itemId, isAdmin }: Props) {
  const qc = useQueryClient();
  const [adjusting, setAdjusting] = useState<StockBatch | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["inventory-batches", itemId],
    queryFn: () => inventoryApi.getBatches(itemId),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!batches?.length) {
    return (
      <EmptyState
        compact
        title="No batches on record"
        description="Receive a delivery to record the first batch."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {batches.map((b) => {
          const isExpired = b.expiry_date && new Date(b.expiry_date) < new Date();
          const expiryDays = b.expiry_date
            ? Math.round((new Date(b.expiry_date).getTime() - Date.now()) / 86_400_000)
            : null;
          const expiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;
          const current = Number(b.current_qty);
          const initial = Number(b.initial_qty);
          const releasedPct = initial > 0
            ? Math.max(0, Math.min(100, Math.round(((initial - current) / initial) * 100)))
            : 0;

          return (
            <li
              key={b.id}
              className={cn(
                "border rounded-lg px-3 py-2.5 transition-colors",
                isExpired
                  ? "bg-red-50 border-red-200"
                  : expiringSoon
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-gray-200",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {(isExpired || expiringSoon) && (
                      <AlertTriangle
                        size={11}
                        className={isExpired ? "text-red-600 shrink-0" : "text-amber-600 shrink-0"}
                        aria-hidden="true"
                      />
                    )}
                    <p className="font-mono text-[11px] font-semibold text-gray-700 truncate">
                      {b.lot_number}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                    <Calendar size={10} className="text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">Received {formatDate(b.received_date)}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-gray-900 tabular-nums leading-tight">
                    {current.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400 tabular-nums">
                    of {initial.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Use-up progress bar */}
              {initial > 0 && (
                <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${releasedPct}%`,
                      background: isExpired ? "var(--color-danger, #b42318)" : "var(--color-brand-500)",
                      opacity: 0.55,
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-2 gap-2">
                <p className={cn(
                  "text-[11px] tabular-nums",
                  isExpired ? "text-red-700 font-semibold" :
                    expiringSoon ? "text-amber-700 font-medium" :
                    "text-gray-500",
                )}>
                  {b.expiry_date
                    ? isExpired
                      ? `Expired ${formatDate(b.expiry_date)}`
                      : expiringSoon
                        ? `Expires in ${expiryDays}d (${formatDate(b.expiry_date)})`
                        : `Expires ${formatDate(b.expiry_date)}`
                    : "No expiry date"}
                </p>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Settings2 size={11} strokeWidth={2.25} />}
                    onClick={() => setAdjusting(b)}
                    className="h-7 px-2 text-[11px]"
                  >
                    Adjust
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {adjusting && (
        <AdjustStockDialog
          batch={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["inventory-batches", itemId] });
            qc.invalidateQueries({ queryKey: ["inventory-movements", itemId] });
            qc.invalidateQueries({ queryKey: ["inventory-items"] });
            qc.invalidateQueries({ queryKey: ["inventory-summary"] });
            qc.invalidateQueries({ queryKey: ["inventory-usage", itemId] });
            setAdjusting(null);
          }}
        />
      )}
    </>
  );
}
