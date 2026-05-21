import { Card, Skeleton } from "@/components/ui";
import type { ReportSummary } from "../api/reports.api";

interface Tile {
  label: string;
  value: string;
  sub: string;
}

/**
 * 4-up KPI strip — matches `AdminReports.jsx` design exactly:
 *   - tiny uppercase label on top
 *   - bold tabular-nums value with a small inline hint to the right
 *   - no icons, no colored backgrounds
 */
export function ReportKpiStrip({
  data,
  isLoading,
}: {
  data?: ReportSummary;
  isLoading?: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3.5 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  const t = data.totals;
  const fmt = (n: number | null | undefined) =>
    n === null || n === undefined ? "—" : n.toLocaleString();
  const issueRate =
    t.delivered > 0
      ? `${((t.quality_issues / t.delivered) * 100).toFixed(1)}% of delivered`
      : "no deliveries";

  const tiles: Tile[] = [
    {
      label: "Distributions",
      value: fmt(t.distributions),
      sub: t.delivered ? `${fmt(t.delivered)} delivered` : "in range",
    },
    {
      label: "Farmers reached",
      value: fmt(t.farmers),
      sub: "registered",
    },
    {
      label: "Avg fulfillment",
      value: t.avg_rating !== null ? t.avg_rating.toFixed(2) : "—",
      sub: t.avg_rating !== null ? "rating · 1–5" : "no feedback",
    },
    {
      label: "Issue rate",
      value: fmt(t.quality_issues),
      sub: issueRate,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((tile) => (
        <Card key={tile.label} className="p-3.5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {tile.label}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <p className="text-xl font-bold text-gray-900 tabular-nums">{tile.value}</p>
            <span className="text-[11px] text-gray-500">{tile.sub}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
