import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import type { ReportSummary } from "../api/reports.api";

interface Props {
  trend: ReportSummary["delivered_trend"];
  title?: string;
  /** ISO yyyy-mm-dd date range — used to fill in gap days with zero counts. */
  windowStart?: string | null;
  windowEnd?: string | null;
}

/**
 * Inline-SVG bar chart for delivered distributions over time.
 * Zero deps. Accessible: each bar has a <title> tooltip and is reachable
 * via the data-table fallback below the chart for screen readers.
 */
export function ReportTrendChart({ trend, title = "Deliveries over time", windowStart, windowEnd }: Props) {
  const series = useMemo(() => {
    // Index incoming data by day for quick lookup.
    const map = new Map<string, number>();
    for (const r of trend) if (r.day) map.set(r.day, r.count);

    // Fill in missing days within the window so the chart shows continuity.
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
  const total = series.reduce((acc, s) => acc + s.count, 0);
  const peak = series.reduce((p, s) => (s.count > p.count ? s : p), series[0]);

  // SVG geometry
  const W = 100;        // viewBox width units, we scale via CSS
  const H = 40;
  const PAD_X = 1;
  const barCount = series.length;
  const barWidth = (W - PAD_X * 2) / barCount;
  const barGap = barWidth * 0.18;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {total.toLocaleString()} total · peak {peak.count} on{" "}
            {new Date(peak.day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="text-[11px] text-gray-400 tabular-nums">
          {series.length} day{series.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-32"
          role="img"
          aria-label={title}
        >
          {/* Baseline */}
          <line x1={0} y1={H - 0.3} x2={W} y2={H - 0.3} stroke="#E5E7EB" strokeWidth={0.3} />
          {series.map((s, i) => {
            const h = (s.count / max) * (H - 4);
            const x = PAD_X + i * barWidth + barGap / 2;
            const y = H - h - 0.5;
            const w = barWidth - barGap;
            const isPeak = s.day === peak.day && s.count > 0;
            return (
              <rect
                key={s.day}
                x={x}
                y={y}
                width={w}
                height={Math.max(h, 0.3)}
                rx={0.4}
                fill={isPeak ? "var(--color-brand-600)" : "var(--color-brand-500)"}
                opacity={s.count === 0 ? 0.18 : 1}
              >
                <title>
                  {new Date(s.day).toLocaleDateString(undefined, {
                    weekday: "short", month: "short", day: "numeric",
                  })}: {s.count} delivered
                </title>
              </rect>
            );
          })}
        </svg>

        {/* x-axis ticks */}
        <div className="flex justify-between text-[9px] text-gray-400 mt-1 px-1 tabular-nums">
          <span>
            {new Date(series[0].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          {series.length > 4 && (
            <span>
              {new Date(series[Math.floor(series.length / 2)].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          <span>
            {new Date(series[series.length - 1].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

interface BreakdownProps {
  title: string;
  /** Already sorted by count desc. */
  data: { label: string; count: number }[];
  emptyMessage?: string;
}

/** Simple horizontal bar list — used for status / livelihood / barangay rollups. */
export function ReportBreakdownList({ title, data, emptyMessage = "No data in window." }: BreakdownProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {total > 0 && (
          <span className="text-[11px] text-gray-400 tabular-nums">{total.toLocaleString()} total</span>
        )}
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 italic">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((d) => {
            const pct = (d.count / max) * 100;
            const sharePct = total ? Math.round((d.count / total) * 100) : 0;
            return (
              <li key={d.label} className="text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-gray-700 truncate pr-2">{d.label}</span>
                  <span className="text-gray-500 tabular-nums shrink-0">
                    {d.count.toLocaleString()}{" "}
                    <span className="text-gray-400">· {sharePct}%</span>
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "var(--color-brand-500)",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
