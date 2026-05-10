import { DistributionTable } from "@/features/distribution/components/DistributionTable";
import { PageHeader } from "@/components/ui";

export default function StaffDistributionPage() {
  return (
    <div>
      <PageHeader
        title="Distribution Queue"
        description="Track and update distribution delivery status."
      />
      <DistributionTable isAdmin={false} />
    </div>
  );
}
