import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { inventoryApi, type InventoryItem } from "../api/inventory.api";
import { ReceiveStockDialog } from "./ReceiveStockDialog";
import { cn } from "@/lib/utils";

const CATEGORIES = ["SEEDS","FERTILIZER","PESTICIDE","TOOLS","OTHER"];

interface Props {
  isAdmin: boolean;
  onSelectItem: (item: InventoryItem) => void;
}

export function InventoryTable({ isAdmin, onSelectItem }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [receiving, setReceiving] = useState<InventoryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "SEEDS", unit: "kg", low_stock_threshold: "0" });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-items", { search, category }],
    queryFn: () => inventoryApi.listItems({ search: search || undefined, category: category || undefined }),
  });

  const createMut = useMutation({
    mutationFn: () => inventoryApi.createItem(newItem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      toast.success("Item added.");
      setAddingItem(false);
      setNewItem({ name: "", category: "SEEDS", unit: "kg", low_stock_threshold: "0" });
    },
    // m-14: surface server errors instead of silently failing
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed to create item."),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#639922]" />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#639922]">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {isAdmin && (
          <button onClick={() => setAddingItem(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md ml-auto"
            style={{ backgroundColor: "#3B6D11" }}>
            <Plus size={14} /> Add Item
          </button>
        )}
      </div>

      {/* Add item inline form */}
      {addingItem && (
        <div className="flex items-end gap-2 p-3 bg-[#EAF3DE] border border-[#3B6D11]/20 rounded-lg">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Unit</label>
            <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {["kg","bag","L","pc","pack","sack"].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Low-stock threshold</label>
            <input type="number" value={newItem.low_stock_threshold}
              onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: e.target.value })}
              className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <button onClick={() => createMut.mutate()} disabled={!newItem.name || createMut.isPending}
            className="px-3 py-1.5 text-sm text-white rounded disabled:opacity-50"
            style={{ backgroundColor: "#3B6D11" }}>Save</button>
          <button onClick={() => setAddingItem(false)} className="px-3 py-1.5 text-sm border rounded">Cancel</button>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-right">Total stock</th>
              <th className="px-4 py-3 text-right">Batches</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!isLoading && data?.results.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No items found.</td></tr>}
            {data?.results.map((item) => (
              <tr key={item.id} onClick={() => onSelectItem(item)} className="hover:bg-[#EAF3DE] cursor-pointer transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                  {item.is_low_stock && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                  {item.name}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{item.category}</td>
                <td className="px-4 py-3 text-gray-600">{item.unit}</td>
                <td className={cn("px-4 py-3 text-right font-medium", item.is_low_stock ? "text-amber-600" : "text-gray-900")}>
                  {Number(item.total_stock).toLocaleString()} {item.unit}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{item.batch_count}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setReceiving(item)}
                      className="px-2 py-1 text-xs text-white rounded"
                      style={{ backgroundColor: "#3B6D11" }}>
                      + Receive
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {receiving && (
        <ReceiveStockDialog
          item={receiving}
          onClose={() => setReceiving(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["inventory-items"] });
            setReceiving(null);
          }}
        />
      )}
    </div>
  );
}
