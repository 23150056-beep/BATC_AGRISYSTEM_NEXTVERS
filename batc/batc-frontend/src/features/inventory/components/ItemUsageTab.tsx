import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Boxes, ClipboardList, Truck, MapPin } from "lucide-react";
import { inventoryApi, type InventoryItem } from "../api/inventory.api";
import { Skeleton, EmptyState, Badge, statusTone } from "@/components/ui";

interface Props {
  item: InventoryItem;
  /** Where to deep-link distributions / programs from. Differs for staff vs admin. */
  basePath: "/admin" | "/staff";
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled", DELIVERED: "Delivered", DELAYED: "Delayed",
  RESCHEDULED: "Rescheduled", OUT_OF_STOCK: "Out of stock", UNAVAILABLE: "Unavailable",
};

export function ItemUsageTab({ item, basePath }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-usage", item.id],
    queryFn: () => inventoryApi.usage(item.id),
    staleTime: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 rounded-md" />
        <Skeleton className="h-16 rounded-md" />
      </div>
    );
  }

  const reservedTotal = Math.round(data.reserved_total);

  return (
    <div className="space-y-5">
      {/* Reservation headline */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-center gap-3">
        <Boxes size={16} className="text-amber-700 shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 tabular-nums">
            {reservedTotal.toLocaleString()} {item.unit} reserved
          </p>
          <p className="text-[11px] text-amber-800/80">
            Across {data.upcoming_count.toLocaleString()} upcoming distribution
            {data.upcoming_count === 1 ? "" : "s"}
          </p>
        </div>
        <p className="text-[11px] text-amber-800/80 tabular-nums shrink-0">
          {Number(item.available_qty).toLocaleString()} {item.unit} free
        </p>
      </div>

      {/* Programs that use this item */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <ClipboardList size={12} className="text-[var(--color-brand-600)]" aria-hidden="true" />
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            Used by programs
            {data.programs.length > 0 && (
              <span className="ml-1 font-normal text-gray-400">· {data.programs.length}</span>
            )}
          </p>
        </div>
        {data.programs.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Not yet referenced by any program. Add it to a program's items list to start tracking demand.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {data.programs.map((p) => (
              <li
                key={p.id}
                className="bg-gray-50 border border-gray-100 rounded-md px-3 py-2 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[10px] text-gray-400 uppercase">{p.code}</p>
                    <Badge tone={statusTone(p.status)} dot>
                      {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{p.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    <span className="tabular-nums">{p.qty_per_beneficiary}</span> {item.unit} per farmer
                    {" · "}
                    <span className="tabular-nums">{p.active_applications}</span> active application
                    {p.active_applications === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  to={`${basePath}/programs`}
                  className="text-[11px] font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-0.5 shrink-0"
                  aria-label={`View ${p.name}`}
                >
                  Open <ArrowUpRight size={11} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming distributions reserving this item */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Truck size={12} className="text-[var(--color-brand-600)]" aria-hidden="true" />
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
            Reserved for distributions
            {data.upcoming_count > 0 && (
              <span className="ml-1 font-normal text-gray-400">· {data.upcoming_count}</span>
            )}
          </p>
        </div>
        {data.upcoming.length === 0 ? (
          <EmptyState
            compact
            icon={<Truck size={16} />}
            title="No reservations"
            description="No scheduled distributions are drawing from this item right now."
          />
        ) : (
          <ul className="space-y-1.5">
            {data.upcoming.map((d) => (
              <li
                key={d.distribution_id}
                className="bg-white border border-gray-200 rounded-md px-3 py-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{d.farmer_name}</p>
                  <Badge tone={statusTone(d.status)} dot>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] text-gray-400 uppercase">{d.program_code}</span>
                  {d.barangay && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin size={10} className="text-gray-400" />
                      {d.barangay}
                    </span>
                  )}
                  <span className="text-gray-400">·</span>
                  <span className="tabular-nums text-amber-700 font-medium">
                    {d.qty_reserved.toLocaleString()} {item.unit}
                  </span>
                  {d.lot_number && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">Lot {d.lot_number}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-gray-400 tabular-nums">
                    {d.scheduled_date
                      ? `Scheduled ${new Date(d.scheduled_date).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                        })}`
                      : "No date set"}
                  </p>
                  <Link
                    to={`${basePath}/distribution`}
                    className="text-[11px] font-semibold text-[var(--color-brand-600)] hover:underline inline-flex items-center gap-0.5"
                  >
                    View <ArrowUpRight size={10} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
