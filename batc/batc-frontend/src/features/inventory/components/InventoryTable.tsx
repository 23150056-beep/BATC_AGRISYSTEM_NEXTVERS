import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, AlertTriangle, Package } from "lucide-react";
import { inventoryApi, type InventoryItem } from "../api/inventory.api";
import { ReceiveStockDialog } from "./ReceiveStockDialog";
import { Card, Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS = [
  { key: "ALL",        label: "All" },
  { key: "SEEDS",      label: "Seeds" },
  { key: "FERTILIZER", label: "Fertilizer" },
  { key: "PESTICIDE",  label: "Pesticide" },
  { key: "TOOLS",      label: "Tools" },
  { key: "OTHER",      label: "Other" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  SEEDS: "Seeds", FERTILIZER: "Fertilizer", PESTICIDE: "Pesticide",
  TOOLS: "Tools", OTHER: "Other",
};

const UNIT_OPTIONS = ["kg", "bag", "L", "pc", "pack", "sack"];

interface Props {
  isAdmin: boolean;
  onSelectItem: (item: InventoryItem) => void;
  /** Selected item id — used to highlight the row when the detail panel is open. */
  selectedId?: number | null;
}

/** Pad numeric id and prefix with category code, e.g. SD-0042 / FT-0007. */
function formatSku(item: InventoryItem) {
  const prefix =
    item.category === "SEEDS"      ? "SD" :
    item.category === "FERTILIZER" ? "FT" :
    item.category === "PESTICIDE"  ? "PS" :
    item.category === "TOOLS"      ? "TL" : "GN";
  return `${prefix}-${String(item.id).padStart(4, "0")}`;
}

export function InventoryTable({ isAdmin, onSelectItem, selectedId = null }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<typeof CATEGORY_FILTERS[number]["key"]>("ALL");
  const [lowOnly, setLowOnly] = useState(false);
  const [receiving, setReceiving] = useState<InventoryItem | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "", category: "SEEDS", unit: "kg", low_stock_threshold: "0",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["inventory-items", { search, category }],
    queryFn: () => inventoryApi.listItems({
      search: search || undefined,
      category: category === "ALL" ? undefined : category,
    }),
  });

  const createMut = useMutation({
    mutationFn: () => inventoryApi.createItem(newItem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-summary"] });
      toast.success("Item added.");
      setAddingItem(false);
      setNewItem({ name: "", category: "SEEDS", unit: "kg", low_stock_threshold: "0" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed to create item."),
  });

  const rows = useMemo(() => {
    const all = data?.results ?? [];
    return lowOnly ? all.filter((i) => i.is_low_stock) : all;
  }, [data, lowOnly]);

  return (
    <div className="space-y-4">
      {/* Inline new-item editor — preserved for admins who don't want a modal */}
      {addingItem && (
        <div className="flex items-end gap-2 p-3 bg-[#EAF3DE] border border-[#3B6D11]/20 rounded-lg flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]"
              placeholder="e.g. Hybrid Rice (NSIC Rc 480)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Category</label>
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40"
            >
              {CATEGORY_FILTERS.filter((c) => c.key !== "ALL").map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Unit</label>
            <select
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40"
            >
              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Low-stock threshold</label>
            <input
              type="number"
              min="0"
              value={newItem.low_stock_threshold}
              onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: e.target.value })}
              className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]"
            />
          </div>
          <Button
            size="sm"
            loading={createMut.isPending}
            disabled={!newItem.name}
            onClick={() => createMut.mutate()}
          >
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAddingItem(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Items card */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]"
              aria-label="Search inventory items"
            />
          </div>

          {/* Segmented category filter */}
          <div
            className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5"
            role="tablist"
            aria-label="Filter by category"
          >
            {CATEGORY_FILTERS.map(({ key, label }) => {
              const active = category === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                    active
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 ml-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="rounded border-gray-300 text-[var(--color-brand-600)] focus:ring-[var(--color-brand-500)]/40"
            />
            Low stock only
          </label>

          <span className="ml-auto text-xs text-gray-500 tabular-nums">
            {rows.length.toLocaleString()} item{rows.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50/60">
                <th className="px-4 py-2.5 font-semibold">SKU</th>
                <th className="px-4 py-2.5 font-semibold">Item</th>
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-4 py-2.5 font-semibold text-right">Available</th>
                <th className="px-4 py-2.5 font-semibold w-48">Level</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                {isAdmin && <th className="px-4 py-2.5 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isAdmin ? 7 : 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!isLoading && rows.map((item) => {
                const stockNum = Number(item.total_stock);
                const reserved = Number(item.reserved_qty ?? 0);
                const available = Number(item.available_qty ?? Math.max(stockNum - reserved, 0));
                const threshold = Number(item.low_stock_threshold) || 0;
                const isLow = item.is_low_stock;
                // Visual scale: % of (1.5 × threshold) — matches the design package.
                const scale = Math.max(threshold * 1.5, 1);
                const availPct = Math.max(0, Math.min(100, Math.round((available / scale) * 100)));
                const reservedPct = Math.max(0, Math.min(100 - availPct, Math.round((reserved / scale) * 100)));
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectItem(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${item.name}`}
                    aria-selected={selectedId === item.id}
                    className={cn(
                      "hover:bg-[#EAF3DE]/60 cursor-pointer transition-colors focus:outline-none focus-visible:bg-[#EAF3DE]/60",
                      selectedId === item.id && "bg-[#EAF3DE]",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-500 tabular-nums">
                      {formatSku(item)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="inline-flex items-center gap-1.5">
                        {isLow && <AlertTriangle size={12} className="text-red-600 shrink-0" aria-hidden="true" />}
                        {item.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={cn("font-semibold", isLow ? "text-red-600" : "text-gray-900")}>
                        {available.toLocaleString()}
                      </span>{" "}
                      <span className="text-gray-400 text-xs">{item.unit} free</span>
                      <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">
                        {stockNum.toLocaleString()} on hand
                        {reserved > 0 && (
                          <> · <span className="text-amber-700">{reserved.toLocaleString()} reserved</span></>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex"
                        role="progressbar"
                        aria-valuenow={availPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Stock level: ${availPct}% free, ${reservedPct}% reserved`}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${availPct}%`,
                            background: isLow ? "var(--color-danger, #b42318)" : "var(--color-brand-500)",
                          }}
                          title={`${available.toLocaleString()} ${item.unit} available`}
                        />
                        {reservedPct > 0 && (
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${reservedPct}%`,
                              // Amber stripe for reserved-but-not-released stock.
                              background: "rgba(194, 104, 46, 0.55)",
                            }}
                            title={`${reserved.toLocaleString()} ${item.unit} reserved for upcoming distributions`}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 tabular-nums">
                        min {threshold.toLocaleString()} {item.unit}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={isLow ? "red" : "green"} dot>
                        {isLow ? "Low" : "OK"}
                      </Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Plus size={12} strokeWidth={2.25} />}
                          onClick={() => setReceiving(item)}
                        >
                          Receive
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!isLoading && rows.length === 0 && (
            <EmptyState
              compact
              icon={<Package size={20} />}
              title={
                lowOnly                  ? "No low-stock items" :
                search || category !== "ALL" ? "No items match" :
                "No inventory yet"
              }
              description={
                lowOnly                  ? "Stock levels are healthy across all items." :
                search || category !== "ALL" ? "Try adjusting your search or filter." :
                isAdmin                  ? "Add your first item to start tracking stock." :
                "Items will appear here once admins add them."
              }
            />
          )}
        </div>
      </Card>

      {/* Floating "Add item" trigger when the inline editor is collapsed.
          Kept separate from the page header so we can hide it for staff. */}
      {isAdmin && !addingItem && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus size={13} strokeWidth={2.25} />}
            onClick={() => setAddingItem(true)}
          >
            Add item inline
          </Button>
        </div>
      )}

      {receiving && (
        <ReceiveStockDialog
          item={receiving}
          onClose={() => setReceiving(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["inventory-items"] });
            qc.invalidateQueries({ queryKey: ["inventory-summary"] });
            setReceiving(null);
          }}
        />
      )}
    </div>
  );
}
