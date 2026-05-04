import { useState } from "react";
import { Plus } from "lucide-react";
import { FarmerTable } from "@/features/farmers/components/FarmerTable";
import { FarmerDetailDrawer } from "@/features/farmers/components/FarmerDetailDrawer";
import { WizardShell } from "@/features/farmers/components/FarmerWizard/WizardShell";
import type { FarmerListItem } from "@/features/farmers/api/farmers.api";

export function StaffFarmersPage() {
  const [selected, setSelected] = useState<FarmerListItem | null>(null);
  const [registering, setRegistering] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Farmers</h1>
          <p className="text-sm text-gray-500 mt-1">Registered farmer profiles in Bauang.</p>
        </div>
        <button
          onClick={() => setRegistering(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: "#3B6D11" }}
        >
          <Plus size={14} /> Register Farmer
        </button>
      </div>

      <FarmerTable isAdmin={false} onSelect={setSelected} />

      {selected && (
        <FarmerDetailDrawer
          farmerId={selected.id}
          isAdmin={false}
          onClose={() => setSelected(null)}
        />
      )}

      {registering && <WizardShell onClose={() => setRegistering(false)} />}
    </div>
  );
}
