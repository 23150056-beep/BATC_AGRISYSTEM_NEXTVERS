import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Truck,
  Package,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";
import { ReportKpiStrip } from "@/features/reports/components/ReportKpiStrip";
import {
  ReportTrendChart,
  ReportBreakdownList,
} from "@/features/reports/components/ReportTrendChart";
import { DateRangePicker, type DateRange } from "@/features/reports/components/DateRangePicker";
import { reportsApi } from "@/features/reports/api/reports.api";
import { cn } from "@/lib/utils";

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
  SUBMITTED:    "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED:     "Approved",
  REJECTED:     "Rejected",
  CANCELLED:    "Cancelled",
  FULFILLED:    "Fulfilled",
};

function distStatusTone(label: string): "green" | "amber" | "red" | "navy" | "neutral" {
  const s = label.toLowerCase();
  if (s.includes("delivered")) return "green";
  if (s.includes("scheduled")) return "amber";
  if (s.includes("delayed") || s.includes("out of stock") || s.includes("unavailable")) return "red";
  if (s.includes("rescheduled")) return "navy";
  return "neutral";
}

type Tab = "overview" | "operations" | "compliance";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview",   label: "Overview" },
  { key: "operations", label: "Operations" },
  { key: "compliance", label: "Compliance" },
];

export default function AdminReportsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [tab, setTab] = useState<Tab>("overview");

  const summaryParams = useMemo(
    () => ({ date_from: range.from, date_to: range.to }),
    [range.from, range.to],
  );

  const { data: summary, isLoading, isFetching } = useQuery({
    queryKey: ["report-summary", summaryParams],
    queryFn: () => reportsApi.summary(summaryParams),
    // Keep the previous summary visible while the new range is fetching so
    // users see a smooth update with an "Updating" pill in the range pill,
    // not an empty page.
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
  const appBreakdown = useMemo(
    () =>
      (summary?.application_status_breakdown ?? []).map((d) => ({
        label: STATUS_LABELS[d.status] ?? d.status,
        count: d.count,
      })),
    [summary],
  );
  const livelihoodBreakdown = useMemo(
    () =>
      (summary?.livelihood_breakdown ?? []).map((d) => ({
        label: d.livelihood_type.replace("_", " "),
        count: d.count,
      })),
    [summary],
  );
  const barangayBreakdown = useMemo(
    () =>
      (summary?.barangay_breakdown ?? []).map((d) => ({
        label: d.barangay || "(Unknown)",
        count: d.count,
      })),
    [summary],
  );

  return (
    <div className="space-y-5">
      {/* Header — matches design exactly:
            ┌─ eyebrow + title + description    ── inline range pill ┐ */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3b6d11]">
            Insights
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aggregate metrics, trend analysis, and CSV exports.
          </p>
        </div>
        <DateRangePicker value={range} onChange={setRange} isFetching={isFetching} />
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="Report sections">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-[#3b6d11]" : "text-gray-500 hover:text-gray-800",
              )}
            >
              {t.label}
              {active && (
                <span
                  className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: "#639922" }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------- OVERVIEW ---------------- */}
      {tab === "overview" && (
        <div className="space-y-4">
          <ReportKpiStrip data={summary} isLoading={isLoading} />

          {/* Row 1: trend (2/3) + distribution status (1/3) */}
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

          {/* Row 2: 3-column plain rollups */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ReportBreakdownList title="Applications by status" data={appBreakdown} />
            <ReportBreakdownList title="Farmers by livelihood" data={livelihoodBreakdown} />
            <ReportBreakdownList title="Top barangays" data={barangayBreakdown} />
          </div>
        </div>
      )}

      {/* ---------------- OPERATIONS ---------------- */}
      {tab === "operations" && (
        <div className="space-y-3 max-w-3xl">
          <p className="text-xs text-gray-500 -mt-1">
            Day-to-day operational exports. Date filter above applies as a default.
          </p>
          <ReportDownloadBar
            title="Distributions Report"
            description="Scheduled and delivered distributions with farmer + program detail."
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
            title="Inventory Stock Report"
            description="Current stock levels, batch counts, and low-stock indicators."
            endpoint="/reports/inventory/"
            icon={Package}
            dateRange={range}
            filters={[
              { key: "category",       label: "Category",       type: "select" },
              { key: "only_low_stock", label: "Low stock only", type: "checkbox" },
            ]}
          />
          <ReportDownloadBar
            title="Farmers Report"
            description="Master list of registered farmer profiles, parcels and household info."
            endpoint="/reports/farmers/"
            icon={Users}
            dateRange={range}
            filters={[
              { key: "livelihood_type", label: "Livelihood",      type: "select" },
              { key: "barangay",        label: "Barangay",        type: "text" },
              { key: "date_from",       label: "Registered from", type: "date" },
              { key: "date_to",         label: "Registered to",   type: "date" },
            ]}
          />
        </div>
      )}

      {/* ---------------- COMPLIANCE ---------------- */}
      {tab === "compliance" && (
        <div className="space-y-3 max-w-3xl">
          <p className="text-xs text-gray-500 -mt-1">
            Audit and compliance reports — application decisions and farmer-reported issues.
          </p>
          <ReportDownloadBar
            title="Applications Report"
            description="Submitted, reviewed, approved and rejected applications, with reviewer."
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
            title="Feedback Report"
            description="Farmer feedback and quality issues raised against distributions."
            endpoint="/reports/feedback/"
            icon={MessageSquare}
            dateRange={range}
            filters={[
              { key: "date_from",    label: "From",         type: "date" },
              { key: "date_to",      label: "To",           type: "date" },
              { key: "status",       label: "Status",       type: "select" },
              { key: "issue_type",   label: "Issue type",   type: "select" },
              { key: "quality_only", label: "Quality only", type: "checkbox" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
