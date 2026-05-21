import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody, EmptyState, Badge, type BadgeProps } from "@/components/ui";
import type { ReportSummary } from "../api/reports.api";

interface Props {
  trend: ReportSummary["delivered_trend"];
  title?: string;
  /** ISO yyyy-mm-dd date range — used to fill in gap days with zero counts. */
  windowStart?: string | null;
  windowEnd?: string | null;
}

/**
 * Delivered-trend chart — matches the design exactly:
 *  - HTML <div> bars (not SVG) inside a fixed-height row
 *  - light brand-green bars with the last bar in dark brand green
 *  - "Daily · last 30 days" subtitle, MoM delta badge top-right
 *  - x-axis: first / mid / last date in font-mono
 */
export function ReportTrendChart({
  trend,
  title = "Delivered trend",
  windowStart,
  windowEnd,
}: Props) {
  const series = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of trend) if (r.day) map.set(r.day, r.count);
    if (!windowStart || !windowEnd) {
      return trend.filter((r) => r.day).map((r) => ({ day: r.day!, count: r.count }));
    }
    const start = new Date(windowStart);
    const end = new Date(windowEnd);
    const out: { day: string; count: number }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const iso = cur.toISOString().slice(0, 10);
      out.push({ day: iso, count: map.get(iso) ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [trend, windowStart, windowEnd]);

  if (!series.length) {
    return (
      <Card>
        <EmptyState
          compact
          icon={<TrendingUp size={18} />}
          title="No deliveries in this window"
          description="Try widening the date range."
        />
      </Card>
    );
  }

  const max = Math.max(...series.map((s) => s.count), 1);

  // First-half vs second-half delta — stands in for "MoM" when the window
  // length doesn't naturally span a month.
  const halfIdx = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, halfIdx).reduce((acc, s) => acc + s.count, 0);
  const secondHalf = series.slice(halfIdx).reduce((acc, s) => acc + s.count, 0);
  const delta =
    firstHalf > 0
      ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
      : secondHalf > 0
        ? 100
        : 0;
  const deltaTone: BadgeProps["tone"] =
    delta > 0 ? "green" : delta < 0 ? "red" : "neutral";

  const days = series.length;
  const subtitle = `Daily · last ${days} day${days === 1 ? "" : "s"}`;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        {series.length >= 4 && (
          <Badge tone={deltaTone} dot>
            {delta > 0 ? "+" : ""}
            {delta}% MoM
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        {/* Bar row — fixed 140px height, max bar 120px, last bar darker */}
        <div className="flex items-end gap-1" style={{ height: 140 }}>
          {series.map((s, i) => {
            const isLast = i === series.length - 1;
            const h = Math.round((s.count / max) * 120);
            return (
              <div
                key={s.day}
                className="flex-1 rounded-t transition-colors"
                style={{
                  height: `${Math.max(h, 1)}px`,
                  background: isLast ? "#3b6d11" : "#cde0a6",
                  opacity: s.count === 0 ? 0.35 : 1,
                }}
                title={`${new Date(s.day).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}: ${s.count} delivered`}
              />
            );
          })}
        </div>
        {/* x-axis: first / mid / last */}
        <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-2">
          <span>{fmtDate(series[0].day)}</span>
          {series.length > 4 && (
            <span>{fmtDate(series[Math.floor(series.length / 2)].day)}</span>
          )}
          <span>{fmtDate(series[series.length - 1].day)}</span>
        </div>
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

interface BreakdownProps {
  title: string;
  /** Already sorted by count desc. */
  data: { label: string; count: number }[];
  emptyMessage?: string;
  /**
   * Visual style:
   *  - "plain" → simple `label / count` rows (default, used for apps,
   *             livelihood, barangays per the design)
   *  - "dots"  → colored category dot before each row (status lists)
   */
  variant?: "plain" | "dots";
  /** Required when variant="dots". */
  toneFor?: (label: string) => "green" | "amber" | "red" | "blue" | "navy" | "neutral";
}

const DOT_COLOR: Record<string, string> = {
  green:   "#2f7d32",
  amber:   "#c2682e",
  red:     "#b42318",
  blue:    "#0c447c",
  navy:    "#162036",
  neutral: "#9ca3af",
};

/**
 * Divide-y list of label/count rows.
 *  - `plain` is the design's default (apps / livelihood / barangays).
 *  - `dots`  is the design's status-list variant (colored 1.5×1.5 dot).
 */
export function ReportBreakdownList({
  title,
  data,
  emptyMessage = "No data in window.",
  variant = "plain",
  toneFor,
}: BreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      {data.length === 0 ? (
        <p className="text-xs text-gray-400 italic px-5 py-4">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.map((d) => {
            const tone = variant === "dots" ? (toneFor?.(d.label) ?? "neutral") : null;
            return (
              <li
                key={d.label}
                className="px-5 py-3 flex items-center justify-between text-sm"
              >
                {tone ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: DOT_COLOR[tone] }}
                      aria-hidden="true"
                    />
                    <span className="text-gray-700 truncate">{d.label}</span>
                  </div>
                ) : (
                  <span className="text-gray-700 truncate pr-2">{d.label}</span>
                )}
                <span className="font-semibold text-gray-900 tabular-nums shrink-0">
                  {d.count.toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
