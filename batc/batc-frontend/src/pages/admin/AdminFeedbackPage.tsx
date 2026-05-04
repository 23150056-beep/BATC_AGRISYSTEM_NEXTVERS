import { FeedbackManagementPanel } from "@/features/feedback/components/FeedbackManagementPanel";

export default function AdminFeedbackPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Feedback</h1>
        <p className="text-sm text-gray-500">Review and manage farmer feedback on program distributions.</p>
      </div>
      <div className="flex-1 min-h-0">
        <FeedbackManagementPanel />
      </div>
    </div>
  );
}
