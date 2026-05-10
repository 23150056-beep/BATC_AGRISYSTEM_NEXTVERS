import { useState } from "react";
import { GitMerge } from "lucide-react";
import { DistributionTable } from "@/features/distribution/components/DistributionTable";
import { BulkAllocateDialog } from "@/features/distribution/components/BulkAllocateDialog";
import { Button, PageHeader } from "@/components/ui";

export default function AdminDistributionPage() {
  const [showBulk, setShowBulk] = useState(false);

  return (
    <div>
      <PageHeader
        title="Distribution"
        description="Manage distribution assignments and delivery status."
        actions={
          <Button leftIcon={<GitMerge size={14} />} onClick={() => setShowBulk(true)}>
            Bulk Allocate
          </Button>
        }
      />

      <DistributionTable isAdmin />

      {showBulk && <BulkAllocateDialog onClose={() => setShowBulk(false)} />}
    </div>
  );
}
