import { useState } from "react";
import { InventoryTable } from "@/features/inventory/components/InventoryTable";
import { InventorySummaryCards } from "@/features/inventory/components/InventorySummaryCards";
import { ItemDetailPanel } from "@/features/inventory/components/ItemDetailPanel";
import { type InventoryItem } from "@/features/inventory/api/inventory.api";
import { PageHeader } from "@/components/ui";

export default function AdminInventoryPage() {
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  return (
    <div className="flex h-full gap-0">
      <div className={selected ? "flex-1 min-w-0 pr-4 space-y-5" : "w-full space-y-5"}>
        <PageHeader
          eyebrow="Operations"
          title="Inventory"
          description="Manage stock items, receive deliveries, and track movements."
        />

        <InventorySummaryCards />

        <InventoryTable
          isAdmin
          selectedId={selected?.id ?? null}
          onSelectItem={(item) => setSelected(item)}
        />
      </div>

      {selected && (
        <div className="w-96 border-l border-gray-200 bg-white flex-shrink-0 h-full overflow-hidden flex flex-col rounded-l-xl shadow-lg">
          <ItemDetailPanel item={selected} isAdmin onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}
