import { ApplicationReviewPanel } from "@/features/applications/components/ApplicationReviewPanel";

export default function StaffApplicationsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Applications</h1>
        <p className="text-sm text-gray-500">Review and process farmer intervention applications.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ApplicationReviewPanel />
      </div>
    </div>
  );
}
