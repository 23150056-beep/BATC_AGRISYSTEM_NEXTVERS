import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi, type StockBatch } from "../api/inventory.api";
import { AdjustStockDialog } from "./AdjustStockDialog";

interface Props {
  itemId: number;
  isAdmin: boolean;
}

export function StockBatchList({ itemId, isAdmin }: Props) {
  const qc = useQueryClient();
  const [adjusting, setAdjusting] = useState<StockBatch | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["inventory-batches", itemId],
    queryFn: () => inventoryApi.getBatches(itemId),
  });

  if (isLoading) return <p className="text-sm text-gray-400 py-2">Loading batches…</p>;
  if (!batches?.length) return <p className="text-sm text-gray-400 italic py-2">No batches on record.</p>;

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 text-left">Lot</th>
              <th className="px-3 py-2 text-left">Received</th>
              <th className="px-3 py-2 text-left">Expiry</th>
              <th className="px-3 py-2 text-right">Current qty</th>
              {isAdmin && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batches.map((b) => {
              const isExpired = b.expiry_date && new Date(b.expiry_date) < new Date();
              return (
                <tr key={b.id} className={isExpired ? "bg-red-50" : undefined}>
                  <td className="px-3 py-2 font-medium text-gray-900">{b.lot_number}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">{b.received_date}</td>
                  <td className="px-3 py-2 text-xs">
                    {b.expiry_date
                      ? <span className={isExpired ? "text-red-600 font-medium" : "text-gray-500"}>{b.expiry_date}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900">
                    {Number(b.current_qty).toLocaleString()}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setAdjusting(b)}
                        className="text-xs text-[#3B6D11] hover:underline">
                        Adjust
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <AdjustStockDialog
          batch={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["inventory-batches", itemId] });
            qc.invalidateQueries({ queryKey: ["inventory-movements", itemId] });
            qc.invalidateQueries({ queryKey: ["inventory-items"] });
            setAdjusting(null);
          }}
        />
      )}
    </>
  );
}
