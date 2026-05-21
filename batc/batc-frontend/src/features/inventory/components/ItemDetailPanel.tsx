import { X, AlertTriangle } from "lucide-react";
import { type InventoryItem } from "../api/inventory.api";
import { StockBatchList } from "./StockBatchList";
import { MovementLedger } from "./MovementLedger";
import { ItemUsageTab } from "./ItemUsageTab";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  item: InventoryItem;
  isAdmin: boolean;
  onClose: () => void;
}

type Tab = "usage" | "batches" | "movements";

const TABS: { key: Tab; label: string }[] = [
  { key: "usage",     label: "Usage" },
  { key: "batches",   label: "Batches" },
  { key: "movements", label: "Movements" },
];

export function ItemDetailPanel({ item, isAdmin, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("usage");

  const total = Number(item.total_stock || 0);
  const reserved = Number(item.reserved_qty ?? 0);
  const available = Number(item.available_qty ?? Math.max(total - reserved, 0));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between px-5 py-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            {item.is_low_stock && <AlertTriangle size={14} className="text-red-600" />}
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.unit}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="p-1 -m-1 rounded text-gray-400 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-3 border-b bg-[#F9FAFB]">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Available</p>
            <p className={cn(
              "text-lg font-bold tabular-nums leading-tight",
              item.is_low_stock ? "text-red-600" : "text-gray-900",
            )}>
              {available.toLocaleString()}{" "}
              <span className="text-xs font-normal text-gray-500">{item.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Reserved</p>
            <p className={cn(
              "text-lg font-bold tabular-nums leading-tight",
              reserved > 0 ? "text-amber-700" : "text-gray-400",
            )}>
              {reserved.toLocaleString()}{" "}
              <span className="text-xs font-normal text-gray-500">{item.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">On hand</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
              {total.toLocaleString()}{" "}
              <span className="text-xs font-normal text-gray-500">{item.unit}</span>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Low-stock threshold</p>
            <p className="text-sm font-semibold text-gray-700 tabular-nums mt-0.5">
              {Number(item.low_stock_threshold).toLocaleString()}{" "}
              <span className="text-xs font-normal text-gray-500">{item.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Active batches</p>
            <p className="text-sm font-semibold text-gray-700 tabular-nums mt-0.5">{item.batch_count}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-5 pt-4 border-b" role="tablist" aria-label="Item details">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              tab === t.key
                ? "border-[var(--color-brand-600)] text-[var(--color-brand-600)]"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "usage"     && <ItemUsageTab item={item} basePath={isAdmin ? "/admin" : "/staff"} />}
        {tab === "batches"   && <StockBatchList itemId={item.id} isAdmin={isAdmin} />}
        {tab === "movements" && <MovementLedger itemId={item.id} />}
      </div>
    </div>
  );
}
