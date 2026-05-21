import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui";
import { reportsApi } from "@/features/reports/api/reports.api";

type FilterType = "text" | "date" | "select" | "checkbox" | "daterange";

export interface ReportFilter {
  key: string;
  label: string;
  type: FilterType;
  options?: { value: string; label: string }[];
  hint?: string;
}

interface Props {
  title: string;
  description?: string;
  endpoint: string;
  /** Optional file basename without `.csv` extension. */
  filename?: string;
  /** Read-only chips shown under the description (design-system labels). */
  filters?: ReportFilter[];
  /** Lucide icon shown in the brand-tinted square tile. */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /**
   * Date range applied at the page level — the only filter the row
   * actively respects when downloading (matching the design's pattern of
   * one global filter + read-only chip labels).
   */
  dateRange?: { from: string; to: string };
}

/**
 * Export row matching the design system's `ReportRow`:
 *   - left:   brand-tinted icon tile
 *   - center: title + description + read-only `font-mono` filter chips
 *   - right:  vertical CSV + XLSX action stack
 *
 * Downloads use the page-level `dateRange` (mapped to date_from/date_to)
 * since the design intentionally keeps per-row UI declarative.
 */
export function ReportDownloadBar({
  title,
  description,
  endpoint,
  filename,
  filters = [],
  icon: Icon = FileSpreadsheet,
  dateRange,
}: Props) {
  const [downloading, setDownloading] = useState(false);

  function activeParams(): Record<string, string> {
    if (!dateRange) return {};
    // Only emit params for filters this report actually accepts — avoids
    // sending date_from to endpoints that don't recognize it.
    const keys = new Set(filters.map((f) => f.key));
    const out: Record<string, string> = {};
    if (keys.has("date_from") && dateRange.from) out.date_from = dateRange.from;
    if (keys.has("date_to") && dateRange.to) out.date_to = dateRange.to;
    return out;
  }

  async function handleDownload(format: "csv" | "xlsx") {
    if (format === "xlsx") {
      toast.info("XLSX export is coming soon — use CSV for now.");
      return;
    }
    setDownloading(true);
    try {
      const fname = `${filename ?? title.toLowerCase().replace(/\s+/g, "_")}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      await reportsApi.download(endpoint, fname, activeParams());
      toast.success(`Exported ${title} to ${fname}`);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        {/* Icon tile */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#eaf3de", color: "#3b6d11" }}
          aria-hidden="true"
        >
          <Icon size={18} />
        </div>

        {/* Center: title + desc + chips */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          )}
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {filters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5"
                >
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: vertical CSV / XLSX */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={11} />}
            loading={downloading}
            onClick={() => handleDownload("csv")}
          >
            CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDownload("xlsx")}>
            XLSX
          </Button>
        </div>
      </div>
    </Card>
  );
}
