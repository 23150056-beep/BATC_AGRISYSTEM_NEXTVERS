import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, Lock, Boxes } from "lucide-react";
import { inventoryApi } from "../api/inventory.api";
import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  neutral: "bg-gray-50      text-gray-700",
  good:    "bg-[#EAF3DE]    text-[#3B6D11]",
  warn:    "bg-amber-50     text-amber-700",
  bad:     "bg-red-50       text-red-700",
  info:    "bg-[#E6F1FB]    text-[#0C447C]",
};

interface TileProps {
  label: string;
  value: string | number;
  icon: typeof Package;
  tone?: keyof typeof TONE;
  sub?: string;
}

function KpiTile({ label, value, icon: Icon, tone = "neutral", sub }: TileProps) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2.5">
        <div className={cn("p-2 rounded-md shrink-0", TONE[tone])} aria-hidden="true">
          <Icon size={14} strokeWidth={2} />
        </div>
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex-1 truncate">
          {label}
        </p>
      </div>
      <p className={cn(
        "text-xl font-bold tabular-nums mt-2 leading-none",
        tone === "bad" ? "text-red-700" : "text-gray-900",
      )}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-400 mt-1.5">{sub}</p>}
    </Card>
  );
}

/**
 * 4-up KPI strip mirroring the design system handoff.
 * Reads /inventory/items/summary/ — single round-trip, server-aggregated.
 */
export function InventorySummaryCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-summary"],
    queryFn: () => inventoryApi.summary(),
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[78px] rounded-xl" />
        ))}
      </div>
    );
  }

  const totalUnits = Math.round(data.total_units);
  const reservedUnits = Math.round(data.reserved_units);
  const availableUnits = Math.round(data.available_units);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KpiTile
        label="Total SKUs"
        value={data.total_skus.toLocaleString()}
        icon={Package}
        tone="good"
        sub={data.categories_count
          ? `${data.categories_count} categor${data.categories_count === 1 ? "y" : "ies"}`
          : undefined}
      />
      <KpiTile
        label="Low stock"
        value={data.low_stock_count.toLocaleString()}
        icon={AlertTriangle}
        tone={data.low_stock_count ? "bad" : "good"}
        sub={data.low_stock_count
          ? "Below distribution threshold"
          : "All items stocked above threshold"}
      />
      <KpiTile
        label="Reserved"
        value={reservedUnits.toLocaleString()}
        icon={Lock}
        tone={reservedUnits > 0 ? "warn" : "neutral"}
        sub={reservedUnits > 0
          ? "Promised to upcoming distributions"
          : "Nothing reserved right now"}
      />
      <KpiTile
        label="Available"
        value={availableUnits.toLocaleString()}
        icon={Boxes}
        tone={availableUnits > 0 ? "good" : "bad"}
        sub={`${totalUnits.toLocaleString()} on hand · ${reservedUnits.toLocaleString()} reserved`}
      />
    </div>
  );
}
