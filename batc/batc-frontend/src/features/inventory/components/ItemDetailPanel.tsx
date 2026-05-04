import { X, AlertTriangle } from "lucide-react";
import { type InventoryItem } from "../api/inventory.api";
import { StockBatchList } from "./StockBatchList";
import { MovementLedger } from "./MovementLedger";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  item: InventoryItem;
  isAdmin: boolean;
  onClose: () => void;
}

type Tab = "batches" | "movements";

export function ItemDetailPanel({ item, isAdmin, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("batches");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between px-5 py-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            {item.is_low_stock && <AlertTriangle size={14} className="text-amber-500" />}
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.unit}</p>
        </div>
        <button onClick={onClose}><X size={16} className="text-gray-400 hover:text-gray-600" /></button>
      </div>

      <div className="px-5 py-3 border-b bg-[#F9FAFB]">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-gray-500">Total stock</p>
            <p className={cn("text-lg font-bold", item.is_low_stock ? "text-amber-600" : "text-gray-900")}>
              {Number(item.total_stock).toLocaleString()} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Low-stock threshold</p>
            <p className="text-lg font-bold text-gray-900">
              {Number(item.low_stock_threshold).toLocaleString()} <span className="text-sm font-normal text-gray-500">{item.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Batches</p>
            <p className="text-lg font-bold text-gray-900">{item.batch_count}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-5 pt-4 border-b">
        {(["batches", "movements"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("pb-3 text-sm font-medium border-b-2 capitalize transition-colors",
              tab === t ? "border-[#3B6D11] text-[#3B6D11]" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {tab === "batches" && <StockBatchList itemId={item.id} isAdmin={isAdmin} />}
        {tab === "movements" && <MovementLedger itemId={item.id} />}
      </div>
    </div>
  );
}
