import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { reportsApi } from "@/features/reports/api/reports.api";

type FilterType = "text" | "date" | "select" | "checkbox" | "daterange";

export interface ReportFilter {
  key: string;
  label: string;
  type: FilterType;
  options?: { value: string; label: string }[];
  /** Hint shown below the input. */
  hint?: string;
}

interface Props {
  title: string;
  description?: string;
  endpoint: string;
  /** Optional file basename without `.csv` extension. */
  filename?: string;
  filters?: ReportFilter[];
  /** Show a small icon left of the title (one of the lucide React components). */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

/**
 * A single export card. State for filters lives in this component so each
 * card is fully isolated — no fragile DOM querying like before.
 *
 * Includes a live "rows to export" preview that hits the backend with
 * `?count=true` so users know whether their filters will return anything
 * before they download a 0-row CSV.
 */
export function ReportDownloadBar({
  title,
  description,
  endpoint,
  filename,
  filters = [],
  icon: Icon = FileSpreadsheet,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState(false);

  // Build the active params, dropping any empty values so the count query
  // matches what the actual download will send.
  const activeParams = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
  const hasFilters = Object.keys(activeParams).length > 0;

  // Live row-count preview, debounced naturally by react-query keyed on params.
  const { data: rowCount, isFetching: countLoading } = useQuery({
    queryKey: ["report-count", endpoint, activeParams],
    queryFn:  () => reportsApi.count(endpoint, activeParams),
    staleTime: 30_000,
  });

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function clearAll() {
    setValues({});
  }

  async function handleDownload() {
    if (rowCount === 0) {
      toast.warning("Nothing to export — no rows match the current filters.");
      return;
    }
    setDownloading(true);
    try {
      const fname = `${filename ?? title.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
      await reportsApi.download(endpoint, fname, activeParams);
      toast.success(`Exported ${rowCount ?? ""} row${rowCount === 1 ? "" : "s"} to ${fname}`);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
            aria-hidden="true"
          >
            <Icon size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          leftIcon={<Download size={12} />}
          loading={downloading}
          disabled={rowCount === 0}
          onClick={handleDownload}
        >
          Download CSV
        </Button>
      </div>

      {filters.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filters.map((f) => (
              <FilterField
                key={f.key}
                filter={f}
                value={values[f.key] ?? ""}
                onChange={(v) => update(f.key, v)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-500">
              {countLoading ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" />
                  Counting…
                </span>
              ) : rowCount !== undefined ? (
                <>
                  <span
                    className={
                      rowCount === 0
                        ? "font-medium text-amber-700"
                        : "font-medium text-gray-700"
                    }
                  >
                    {rowCount.toLocaleString()}
                  </span>{" "}
                  row{rowCount === 1 ? "" : "s"} will be exported
                </>
              ) : null}
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                type="button"
                className="text-[11px] text-gray-500 hover:text-gray-800 inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded"
              >
                <X size={11} /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: ReportFilter;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `report-${filter.key}`;
  const baseInput =
    "w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30 focus:border-[var(--color-brand-500)]";

  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-medium text-gray-600 mb-1">
        {filter.label}
      </label>
      {filter.type === "select" ? (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        >
          <option value="">All</option>
          {filter.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : filter.type === "checkbox" ? (
        <label htmlFor={id} className="flex items-center gap-2 h-[34px] px-2.5 border border-gray-300 rounded-md text-sm bg-white cursor-pointer hover:bg-gray-50">
          <input
            id={id}
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "")}
            className="rounded border-gray-300 text-[var(--color-brand-600)] focus:ring-[var(--color-brand-500)]/30"
          />
          <span className="text-xs text-gray-700">{filter.hint ?? "Enable"}</span>
        </label>
      ) : (
        <input
          id={id}
          type={filter.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        />
      )}
      {filter.hint && filter.type !== "checkbox" && (
        <p className="text-[10px] text-gray-400 mt-0.5">{filter.hint}</p>
      )}
    </div>
  );
}
