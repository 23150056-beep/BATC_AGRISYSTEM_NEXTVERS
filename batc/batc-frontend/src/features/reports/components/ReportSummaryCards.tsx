import {
  Users, Truck, ClipboardList, Package, Star, AlertTriangle,
  CheckCircle2, Clock, type LucideIcon,
} from "lucide-react";
import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ReportSummary } from "../api/reports.api";

interface KpiTileProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}

const TONE: Record<NonNullable<KpiTileProps["tone"]>, string> = {
  neutral: "bg-gray-50      text-gray-700",
  good:    "bg-[#EAF3DE]    text-[#3B6D11]",
  warn:    "bg-amber-50     text-amber-700",
  bad:     "bg-red-50       text-red-700",
  info:    "bg-[#E6F1FB]    text-[#0C447C]",
};

function KpiTile({ label, value, sub, icon: Icon, tone = "neutral" }: KpiTileProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-lg shrink-0", TONE[tone])} aria-hidden="true">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-gray-900 leading-tight tabular-nums">{value}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

interface Props {
  data?: ReportSummary;
  isLoading?: boolean;
  /** Pass false on staff page to hide admin-only KPIs (rates, ratings). */
  fullSet?: boolean;
}

export function ReportSummaryCards({ data, isLoading, fullSet = true }: Props) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const t = data.totals;
  const fmt = (n: number | null) => (n === null || n === undefined ? "—" : n.toLocaleString());
  const pct = (n: number | null) => (n === null || n === undefined ? "—" : `${n}%`);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      <KpiTile
        label="Registered Farmers"
        value={fmt(t.farmers)}
        icon={Users}
        tone="good"
        sub="All time, non-archived"
      />
      <KpiTile
        label="Distributions in window"
        value={fmt(t.distributions)}
        icon={Truck}
        tone="info"
        sub={`${t.delivered} delivered · ${t.scheduled} scheduled`}
      />
      <KpiTile
        label="Delivered"
        value={fmt(t.delivered)}
        icon={CheckCircle2}
        tone="good"
      />
      <KpiTile
        label="Delayed / Rescheduled"
        value={fmt(t.delayed)}
        icon={Clock}
        tone={t.delayed ? "warn" : "neutral"}
      />
      <KpiTile
        label="Applications"
        value={fmt(t.applications)}
        icon={ClipboardList}
        tone="info"
        sub={fullSet ? `Approval rate: ${pct(t.approval_rate)}` : undefined}
      />
      <KpiTile
        label="Inventory Items"
        value={fmt(t.inventory_items)}
        icon={Package}
        tone={t.low_stock_items ? "warn" : "neutral"}
        sub={t.low_stock_items ? `${t.low_stock_items} low-stock` : "Healthy"}
      />
      {fullSet && (
        <>
          <KpiTile
            label="Avg. Feedback Rating"
            value={t.avg_rating !== null ? t.avg_rating.toFixed(2) : "—"}
            icon={Star}
            tone={t.avg_rating === null ? "neutral" : t.avg_rating >= 4 ? "good" : t.avg_rating >= 3 ? "warn" : "bad"}
            sub={`${t.feedback_count} responses`}
          />
          <KpiTile
            label="Quality Issues"
            value={fmt(t.quality_issues)}
            icon={AlertTriangle}
            tone={t.quality_issues ? "bad" : "good"}
            sub={t.quality_issues ? "Damaged / wrong / expired" : "None reported"}
          />
        </>
      )}
    </div>
  );
}
