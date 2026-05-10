import { useState } from "react";
import { Plus } from "lucide-react";
import { FarmerTable } from "@/features/farmers/components/FarmerTable";
import { FarmerDetailDrawer } from "@/features/farmers/components/FarmerDetailDrawer";
import { WizardShell } from "@/features/farmers/components/FarmerWizard/WizardShell";
import type { FarmerListItem } from "@/features/farmers/api/farmers.api";
import { Button, PageHeader } from "@/components/ui";

export function AdminFarmersPage() {
  const [selected, setSelected] = useState<FarmerListItem | null>(null);
  const [registering, setRegistering] = useState(false);

  return (
    <div>
      <PageHeader
        title="Farmers"
        description="Registered farmer profiles in Bauang."
        actions={
          <Button leftIcon={<Plus size={14} />} onClick={() => setRegistering(true)}>
            Register Farmer
          </Button>
        }
      />

      <FarmerTable isAdmin onSelect={setSelected} />

      {selected && (
        <FarmerDetailDrawer
          farmerId={selected.id}
          isAdmin
          onClose={() => setSelected(null)}
        />
      )}

      {registering && <WizardShell onClose={() => setRegistering(false)} />}
    </div>
  );
}
