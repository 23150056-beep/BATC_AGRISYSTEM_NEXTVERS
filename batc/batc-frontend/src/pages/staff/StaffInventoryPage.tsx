import { useState } from "react";
import { InventoryTable } from "@/features/inventory/components/InventoryTable";
import { ItemDetailPanel } from "@/features/inventory/components/ItemDetailPanel";
import { type InventoryItem } from "@/features/inventory/api/inventory.api";

export default function StaffInventoryPage() {
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  return (
    <div className="flex h-full gap-0">
      <div className={selected ? "flex-1 min-w-0 pr-4" : "w-full"}>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">View stock levels and batch details.</p>
        </div>
        <InventoryTable isAdmin={false} onSelectItem={(item) => setSelected(item)} />
      </div>

      {selected && (
        <div className="w-96 border-l border-gray-200 bg-white flex-shrink-0 h-full overflow-hidden flex flex-col">
          <ItemDetailPanel item={selected} isAdmin={false} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}
