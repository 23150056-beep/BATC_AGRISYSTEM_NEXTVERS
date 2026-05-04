import { useState } from "react";
import { GitMerge } from "lucide-react";
import { DistributionTable } from "@/features/distribution/components/DistributionTable";
import { BulkAllocateDialog } from "@/features/distribution/components/BulkAllocateDialog";

export default function AdminDistributionPage() {
  const [showBulk, setShowBulk] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Distribution</h1>
          <p className="text-sm text-gray-500">Manage distribution assignments and delivery status.</p>
        </div>
        <button onClick={() => setShowBulk(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: "#3B6D11" }}>
          <GitMerge size={14} /> Bulk Allocate
        </button>
      </div>

      <DistributionTable isAdmin />

      {showBulk && <BulkAllocateDialog onClose={() => setShowBulk(false)} />}
    </div>
  );
}
