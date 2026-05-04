import { DistributionTable } from "@/features/distribution/components/DistributionTable";

export default function StaffDistributionPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Distribution Queue</h1>
        <p className="text-sm text-gray-500">Track and update distribution delivery status.</p>
      </div>
      <DistributionTable isAdmin={false} />
    </div>
  );
}
