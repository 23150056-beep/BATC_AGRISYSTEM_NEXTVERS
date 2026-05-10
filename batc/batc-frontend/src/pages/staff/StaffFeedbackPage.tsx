import { FeedbackManagementPanel } from "@/features/feedback/components/FeedbackManagementPanel";
import { PageHeader } from "@/components/ui";

export default function StaffFeedbackPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Feedback"
        description="Review and manage farmer feedback on program distributions."
      />
      <div className="flex-1 min-h-0">
        <FeedbackManagementPanel />
      </div>
    </div>
  );
}
