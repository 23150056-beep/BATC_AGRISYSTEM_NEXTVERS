import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";
import { PageHeader } from "@/components/ui";

const DIST_STATUSES = [
  "SCHEDULED","DELIVERED","DELAYED","RESCHEDULED","OUT_OF_STOCK","UNAVAILABLE"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

export default function StaffReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Download CSV reports for distributions and farmers."
      />
      <div className="space-y-4 max-w-2xl">
        <ReportDownloadBar
          title="Farmers Report"
          endpoint="/reports/farmers/"
        />
        <ReportDownloadBar
          title="Distributions Report"
          endpoint="/reports/distributions/"
          filters={[
            { key: "status", label: "Status", type: "select", options: DIST_STATUSES },
            { key: "scheduled_date", label: "Scheduled date", type: "date" },
          ]}
        />
      </div>
    </div>
  );
}
