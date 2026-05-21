import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Settings2, type LucideIcon } from "lucide-react";
import { inventoryApi } from "../api/inventory.api";
import { Skeleton, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props {
  itemId: number;
}

const TYPE_META: Record<string, {
  label: string;
  badge: string;
  icon: LucideIcon;
  iconBg: string;
}> = {
  RECEIVE: {
    label:  "Received",
    badge:  "bg-[#EAF3DE] text-[#27500A] ring-1 ring-inset ring-[#3B6D11]/20",
    icon:   ArrowDownRight,
    iconBg: "bg-[#EAF3DE] text-[#3B6D11]",
  },
  RELEASE: {
    label:  "Released",
    badge:  "bg-[#FAEEDA] text-[#633806] ring-1 ring-inset ring-[#c2682e]/30",
    icon:   ArrowUpRight,
    iconBg: "bg-[#FAEEDA] text-[#a55522]",
  },
  ADJUSTMENT: {
    label:  "Adjusted",
    badge:  "bg-[#E6F1FB] text-[#0C447C] ring-1 ring-inset ring-[#0C447C]/20",
    icon:   Settings2,
    iconBg: "bg-[#E6F1FB] text-[#0C447C]",
  },
};

/**
 * Narrow-drawer-friendly stock movement ledger.
 *
 * Renders movements as a vertical list of cards instead of a table — the
 * detail panel is only 384px wide so a 5-column table gets clipped on the
 * right. Each row shows Type · Qty · Date · Author · Reference, all
 * stacked so nothing falls off-screen.
 */
export function MovementLedger({ itemId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-movements", itemId],
    queryFn: () => inventoryApi.getMovements(itemId),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!data?.results.length) {
    return (
      <EmptyState
        compact
        title="No movements yet"
        description="Receipts, releases, and adjustments will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {data.results.map((m) => {
        const qty = Number(m.quantity);
        const meta = TYPE_META[m.movement_type] ?? {
          label:  m.movement_type,
          badge:  "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200",
          icon:   Settings2,
          iconBg: "bg-gray-100 text-gray-500",
        };
        const Icon = meta.icon;
        const date = new Date(m.created_at);
        return (
          <li
            key={m.id}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2.5"
          >
            <div className="flex items-start gap-2.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
                  meta.iconBg,
                )}
                aria-hidden="true"
              >
                <Icon size={14} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
                    meta.badge,
                  )}>
                    {meta.label}
                  </span>
                  <span className={cn(
                    "text-sm font-bold tabular-nums shrink-0",
                    qty < 0 ? "text-red-600" : "text-emerald-700",
                  )}>
                    {qty > 0 ? "+" : ""}{qty.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 tabular-nums">
                  {date.toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                  {" · "}
                  <span className="text-gray-700">{m.created_by_name || "System"}</span>
                </p>
                {m.reference_note && (
                  <p className="text-xs text-gray-600 mt-1 break-words">
                    {m.reference_note}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
