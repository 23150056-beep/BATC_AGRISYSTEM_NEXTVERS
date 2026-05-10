import { ApplicationReviewPanel } from "@/features/applications/components/ApplicationReviewPanel";
import { PageHeader } from "@/components/ui";

export default function StaffApplicationsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Applications"
        description="Review and process farmer intervention applications."
      />
      <div className="flex-1 min-h-0">
        <ApplicationReviewPanel />
      </div>
    </div>
  );
}
