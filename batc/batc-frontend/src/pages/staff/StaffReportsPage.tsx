import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, Users, ClipboardList } from "lucide-react";
import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";
import { ReportTrendChart, ReportBreakdownList } from "@/features/reports/components/ReportTrendChart";
import { DateRangePicker, type DateRange } from "@/features/reports/components/DateRangePicker";
import { reportsApi } from "@/features/reports/api/reports.api";
import { PageHeader } from "@/components/ui";

const DIST_STATUSES = [
  "SCHEDULED","DELIVERED","DELAYED","RESCHEDULED","OUT_OF_STOCK","UNAVAILABLE"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

const APP_STATUSES = [
  "SUBMITTED","UNDER_REVIEW","APPROVED","REJECTED","CANCELLED","FULFILLED"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled", DELIVERED: "Delivered", DELAYED: "Delayed",
  RESCHEDULED: "Rescheduled", OUT_OF_STOCK: "Out of Stock", UNAVAILABLE: "Unavailable",
};

export default function StaffReportsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["report-summary", range],
    queryFn:  () => reportsApi.summary({ date_from: range.from, date_to: range.to }),
  });

  const distBreakdown = useMemo(
    () => (summary?.distribution_status_breakdown ?? []).map((d) => ({
      label: STATUS_LABELS[d.status] ?? d.status, count: d.count,
    })),
    [summary]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Track operational activity and download CSV exports."
      />

      <DateRangePicker value={range} onChange={setRange} />

      {/* Compact summary — staff don't need feedback/admin metrics */}
      <ReportSummaryCards data={summary} isLoading={isLoading} fullSet={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ReportTrendChart
            trend={summary?.delivered_trend ?? []}
            windowStart={summary?.window.date_from}
            windowEnd={summary?.window.date_to}
          />
        </div>
        <ReportBreakdownList
          title="Distribution status"
          data={distBreakdown}
        />
      </div>

      <div className="space-y-3 max-w-3xl">
        <h2 className="text-sm font-semibold text-gray-700 mt-2">CSV Exports</h2>
        <ReportDownloadBar
          title="Distributions Report"
          description="Scheduled and delivered distributions assigned to your queue."
          endpoint="/reports/distributions/"
          icon={Truck}
          filters={[
            { key: "date_from", label: "From",  type: "date" },
            { key: "date_to",   label: "To",    type: "date" },
            { key: "status",    label: "Status", type: "select", options: DIST_STATUSES },
            { key: "scheduled_date", label: "Specific date", type: "date" },
          ]}
        />
        <ReportDownloadBar
          title="Applications Report"
          description="All applications relevant to your review queue."
          endpoint="/reports/applications/"
          icon={ClipboardList}
          filters={[
            { key: "date_from", label: "From",   type: "date" },
            { key: "date_to",   label: "To",     type: "date" },
            { key: "status",    label: "Status", type: "select", options: APP_STATUSES },
          ]}
        />
        <ReportDownloadBar
          title="Farmers Report"
          description="Farmer master list with profile and parcel info."
          endpoint="/reports/farmers/"
          icon={Users}
          filters={[
            { key: "barangay",  label: "Barangay",        type: "text", hint: "Exact match" },
            { key: "date_from", label: "Registered from", type: "date" },
            { key: "date_to",   label: "Registered to",   type: "date" },
          ]}
        />
      </div>
    </div>
  );
}
