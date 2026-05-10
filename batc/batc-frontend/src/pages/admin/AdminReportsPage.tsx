import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Truck, Package, ClipboardList, MessageSquare,
} from "lucide-react";
import { ReportDownloadBar } from "@/features/reports/components/ReportDownloadBar";
import { ReportSummaryCards } from "@/features/reports/components/ReportSummaryCards";
import { ReportTrendChart, ReportBreakdownList } from "@/features/reports/components/ReportTrendChart";
import { DateRangePicker, type DateRange } from "@/features/reports/components/DateRangePicker";
import { reportsApi } from "@/features/reports/api/reports.api";
import { PageHeader } from "@/components/ui";

const LIVELIHOOD_OPTIONS = [
  "RICE","CORN","VEGETABLE","FRUIT","LIVESTOCK","POULTRY","FISHERY","OTHER"
].map((v) => ({ value: v, label: v }));

const DIST_STATUSES = [
  "SCHEDULED","DELIVERED","DELAYED","RESCHEDULED","OUT_OF_STOCK","UNAVAILABLE"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

const APP_STATUSES = [
  "SUBMITTED","UNDER_REVIEW","APPROVED","REJECTED","CANCELLED","FULFILLED"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

const FB_STATUSES = [
  "NEW","ACKNOWLEDGED","RESOLVED"
].map((v) => ({ value: v, label: v }));

const ISSUE_TYPES = [
  "GENERAL","DAMAGED","EXPIRED","WRONG_QUANTITY","WRONG_ITEM"
].map((v) => ({ value: v, label: v.replace("_", " ") }));

const INV_CATEGORIES = [
  { value: "SEEDS",      label: "Seeds" },
  { value: "FERTILIZER", label: "Fertilizer" },
  { value: "PESTICIDE",  label: "Pesticide" },
  { value: "TOOLS",      label: "Tools / Equipment" },
  { value: "OTHER",      label: "Other" },
];

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29); // last 30 days inclusive
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled", DELIVERED: "Delivered", DELAYED: "Delayed",
  RESCHEDULED: "Rescheduled", OUT_OF_STOCK: "Out of Stock", UNAVAILABLE: "Unavailable",
  SUBMITTED: "Submitted", UNDER_REVIEW: "Under Review", APPROVED: "Approved",
  REJECTED: "Rejected", CANCELLED: "Cancelled", FULFILLED: "Fulfilled",
};

type Tab = "overview" | "operations" | "compliance";

export default function AdminReportsPage() {
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [tab, setTab] = useState<Tab>("overview");

  const summaryParams = useMemo(
    () => ({ date_from: range.from, date_to: range.to }),
    [range.from, range.to]
  );

  const { data: summary, isLoading } = useQuery({
    queryKey: ["report-summary", summaryParams],
    queryFn:  () => reportsApi.summary(summaryParams),
  });

  // Build breakdown data for the rollup lists
  const distBreakdown = useMemo(
    () => (summary?.distribution_status_breakdown ?? []).map((d) => ({
      label: STATUS_LABELS[d.status] ?? d.status, count: d.count,
    })),
    [summary]
  );
  const appBreakdown = useMemo(
    () => (summary?.application_status_breakdown ?? []).map((d) => ({
      label: STATUS_LABELS[d.status] ?? d.status, count: d.count,
    })),
    [summary]
  );
  const livelihoodBreakdown = useMemo(
    () => (summary?.livelihood_breakdown ?? []).map((d) => ({
      label: d.livelihood_type.replace("_", " "), count: d.count,
    })),
    [summary]
  );
  const barangayBreakdown = useMemo(
    () => (summary?.barangay_breakdown ?? []).map((d) => ({
      label: d.barangay || "(Unknown)", count: d.count,
    })),
    [summary]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Aggregate metrics, trend analysis, and CSV exports for all programs."
      />

      <DateRangePicker value={range} onChange={setRange} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="Report sections">
        {([
          { key: "overview",   label: "Overview" },
          { key: "operations", label: "Operations" },
          { key: "compliance", label: "Compliance" },
        ] as const).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={
                "relative px-3 py-2 text-sm font-medium transition-colors " +
                (active
                  ? "text-[var(--color-brand-700)]"
                  : "text-gray-500 hover:text-gray-800")
              }
            >
              {t.label}
              {active && (
                <span
                  className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full"
                  style={{ background: "var(--color-brand-600)" }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-5">
          <ReportSummaryCards data={summary} isLoading={isLoading} />

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ReportBreakdownList
              title="Applications by status"
              data={appBreakdown}
            />
            <ReportBreakdownList
              title="Farmers by livelihood"
              data={livelihoodBreakdown}
            />
            <ReportBreakdownList
              title="Top barangays"
              data={barangayBreakdown}
            />
          </div>
        </div>
      )}

      {/* OPERATIONS */}
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
            filters={[
              { key: "date_from", label: "From",  type: "date" },
              { key: "date_to",   label: "To",    type: "date" },
              { key: "status",    label: "Status", type: "select", options: DIST_STATUSES },
              { key: "scheduled_date", label: "Specific date", type: "date" },
            ]}
          />
          <ReportDownloadBar
            title="Inventory Stock Report"
            description="Current stock levels, batch counts, and low-stock indicators."
            endpoint="/reports/inventory/"
            icon={Package}
            filters={[
              { key: "category",       label: "Category", type: "select", options: INV_CATEGORIES },
              { key: "only_low_stock", label: "Filter",   type: "checkbox", hint: "Low stock only" },
            ]}
          />
          <ReportDownloadBar
            title="Farmers Report"
            description="Master list of registered farmer profiles, parcels and household info."
            endpoint="/reports/farmers/"
            icon={Users}
            filters={[
              { key: "livelihood_type", label: "Livelihood", type: "select", options: LIVELIHOOD_OPTIONS },
              { key: "barangay",        label: "Barangay",   type: "text",   hint: "Exact match" },
              { key: "date_from",       label: "Registered from", type: "date" },
              { key: "date_to",         label: "Registered to",   type: "date" },
            ]}
          />
        </div>
      )}

      {/* COMPLIANCE */}
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
            filters={[
              { key: "date_from", label: "From",   type: "date" },
              { key: "date_to",   label: "To",     type: "date" },
              { key: "status",    label: "Status", type: "select", options: APP_STATUSES },
            ]}
          />
          <ReportDownloadBar
            title="Feedback Report"
            description="Farmer feedback and quality issues raised against distributions."
            endpoint="/reports/feedback/"
            icon={MessageSquare}
            filters={[
              { key: "date_from",    label: "From",       type: "date" },
              { key: "date_to",      label: "To",         type: "date" },
              { key: "status",       label: "Status",     type: "select", options: FB_STATUSES },
              { key: "issue_type",   label: "Issue type", type: "select", options: ISSUE_TYPES },
              { key: "quality_only", label: "Filter",     type: "checkbox", hint: "Quality issues only" },
            ]}
          />
        </div>
      )}

    </div>
  );
}
