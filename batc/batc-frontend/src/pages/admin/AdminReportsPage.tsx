import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";
import { PageHeader } from "@/components/ui";

const LIVELIHOOD_OPTIONS = [
  "RICE","CORN","VEGETABLE","FRUIT","LIVESTOCK","POULTRY","FISHERY","OTHER"
].map((v) => ({ value: v, label: v }));

const DIST_STATUSES = [
  "SCHEDULED","DELIVERED","DELAYED","RESCHEDULED","OUT_OF_STOCK","UNAVAILABLE"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

export default function AdminReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Download CSV reports for farmers, distributions, and inventory."
      />
      <div className="space-y-4 max-w-2xl">
        <ReportDownloadBar
          title="Farmers Report"
          endpoint="/reports/farmers/"
          filters={[
            { key: "livelihood_type", label: "Livelihood", type: "select", options: LIVELIHOOD_OPTIONS },
          ]}
        />
        <ReportDownloadBar
          title="Distributions Report"
          endpoint="/reports/distributions/"
          filters={[
            { key: "status", label: "Status", type: "select", options: DIST_STATUSES },
            { key: "scheduled_date", label: "Scheduled date", type: "date" },
          ]}
        />
        <ReportDownloadBar
          title="Inventory Stock Report"
          endpoint="/reports/inventory/"
        />
      </div>
    </div>
  );
}
