import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, Users, ClipboardList } from "lucide-react";
import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";
import { ReportKpiStrip } from "@/features/reports/components/ReportKpiStrip";
import {
  ReportTrendChart,
  ReportBreakdownList,
} from "@/features/reports/components/ReportTrendChart";
import { DateRangePicker, type DateRange } from "@/features/reports/components/DateRangePicker";
import { reportsApi } from "@/features/reports/api/reports.api";

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED:    "Scheduled",
  DELIVERED:    "Delivered",
  DELAYED:      "Delayed",
  RESCHEDULED:  "Rescheduled",
  OUT_OF_STOCK: "Out of stock",
  UNAVAILABLE:  "Unavailable",
};

function distStatusTone(label: string): "green" | "amber" | "red" | "navy" | "neutral" {
  const s = label.toLowerCase();
  if (s.includes("delivered")) return "green";
  if (s.includes("scheduled")) return "amber";
  if (s.includes("delayed") || s.includes("out of stock") || s.includes("unavailable")) return "red";
  if (s.includes("rescheduled")) return "navy";
  return "neutral";
}

export default function StaffReportsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange);

  const { data: summary, isLoading, isFetching } = useQuery({
    queryKey: ["report-summary", range],
    queryFn: () => reportsApi.summary({ date_from: range.from, date_to: range.to }),
    placeholderData: (prev) => prev,
  });

  const distBreakdown = useMemo(
    () =>
      (summary?.distribution_status_breakdown ?? []).map((d) => ({
        label: STATUS_LABELS[d.status] ?? d.status,
        count: d.count,
      })),
    [summary],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3b6d11]">
            Insights
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track operational activity and download CSV exports.
          </p>
        </div>
        <DateRangePicker value={range} onChange={setRange} isFetching={isFetching} />
      </header>

      <ReportKpiStrip data={summary} isLoading={isLoading} />

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
          variant="dots"
          toneFor={distStatusTone}
        />
      </div>

      <div className="space-y-3 max-w-3xl">
        <h2 className="text-sm font-semibold text-gray-700 mt-2">CSV Exports</h2>
        <ReportDownloadBar
          title="Distributions Report"
          description="Scheduled and delivered distributions assigned to your queue."
          endpoint="/reports/distributions/"
          icon={Truck}
          dateRange={range}
          filters={[
            { key: "date_from",      label: "From",          type: "date" },
            { key: "date_to",        label: "To",            type: "date" },
            { key: "status",         label: "Status",        type: "select" },
            { key: "scheduled_date", label: "Specific date", type: "date" },
          ]}
        />
        <ReportDownloadBar
          title="Applications Report"
          description="All applications relevant to your review queue."
          endpoint="/reports/applications/"
          icon={ClipboardList}
          dateRange={range}
          filters={[
            { key: "date_from", label: "From",   type: "date" },
            { key: "date_to",   label: "To",     type: "date" },
            { key: "status",    label: "Status", type: "select" },
          ]}
        />
        <ReportDownloadBar
          title="Farmers Report"
          description="Farmer master list with profile and parcel info."
          endpoint="/reports/farmers/"
          icon={Users}
          dateRange={range}
          filters={[
            { key: "barangay",  label: "Barangay",        type: "text" },
            { key: "date_from", label: "Registered from", type: "date" },
            { key: "date_to",   label: "Registered to",   type: "date" },
          ]}
        />
      </div>
    </div>
  );
}
