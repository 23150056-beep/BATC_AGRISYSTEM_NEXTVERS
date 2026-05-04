import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";

const DIST_STATUSES = [
  "SCHEDULED","DELIVERED","DELAYED","RESCHEDULED","OUT_OF_STOCK","UNAVAILABLE"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

export default function StaffReportsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Download CSV reports.</p>
      </div>

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
