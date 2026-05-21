import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, ShieldCheck, Shield, Clock, ShieldAlert, User } from "lucide-react";
import { farmersApi, type FarmerListItem, type VerificationStatus } from "../api/farmers.api";
import { Card, Badge, EmptyState, Skeleton, statusTone } from "@/components/ui";
import { cn } from "@/lib/utils";

const VSTYLE: Record<VerificationStatus, { label: string; cls: string; icon: React.ElementType }> = {
  VERIFIED:   { label: "Verified",  cls: "text-[#27500A] bg-[#EAF3DE]", icon: ShieldCheck },
  PENDING:    { label: "Pending",   cls: "text-amber-700 bg-amber-50",  icon: Clock       },
  REJECTED:   { label: "Rejected",  cls: "text-red-700 bg-red-50",      icon: ShieldAlert },
  UNVERIFIED: { label: "—",         cls: "text-gray-400 bg-transparent", icon: Shield     },
};

function VerifBadge({ status }: { status: VerificationStatus }) {
  const s = VSTYLE[status] ?? VSTYLE.UNVERIFIED;
  const Icon = s.icon;
  if (status === "UNVERIFIED") return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium", s.cls)}>
      <Icon size={10} />
      {s.label}
    </span>
  );
}

function FarmerAvatar({ src, name, size = 32 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return src ? (
    <img src={src} alt="" aria-hidden className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
    >
      <span className="text-[11px] font-bold">{initials || <User size={12} />}</span>
    </div>
  );
}

const BAUANG_BARANGAYS = [
  "Baccuit Norte","Baccuit Sur","Bagbag","Ballay","Bella Union","Bili","Bungro",
  "Cabaroan (Poro)","Calumbaya","Carmay","Casilagan","Central East (Poblacion)",
  "Central West (Poblacion)","Dili","Disso-or","Guerrero","Lasip","Lingsat",
  "Mabanbanag","Maoasoas","Pagdalagan Norte","Pagdalagan Sur","Palina East",
  "Palina West","Penroad (Sao-it)","Piayong","Picinan","Pindangan East",
  "Pindangan West","Quintarong","Rabon","Ramot","San Agustin (Pugo)","San Felipe",
  "San Isidro (Baraoas)","San Juan","San Luis","Santa Monica","Sapilang",
];

type StatusFilter = "ALL" | "ACTIVE" | "ARCHIVED";

const STATUS_FILTERS: { key: StatusFilter; label: string; archived: "all" | "false" | "true" }[] = [
  { key: "ALL",      label: "All",      archived: "all"  },
  { key: "ACTIVE",   label: "Active",   archived: "false" },
  { key: "ARCHIVED", label: "Archived", archived: "true" },
];

const LIVELIHOOD_LABELS: Record<string, string> = {
  RICE: "Rice", CORN: "Corn", VEGETABLE: "Vegetable", FRUIT: "Fruit",
  LIVESTOCK: "Livestock", POULTRY: "Poultry", FISHERY: "Fishery",
  OTHER: "Other",
};

/** Pad farmer ID to 4 digits — F-0042. Mirrors the design's farmer-ID format. */
function formatFarmerId(id: number) {
  return `F-${String(id).padStart(4, "0")}`;
}

interface Props {
  onSelect: (farmer: FarmerListItem) => void;
  isAdmin?: boolean;
}

export function FarmerTable({ onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [barangay, setBarangay] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [page, setPage] = useState(1);

  const archivedParam = STATUS_FILTERS.find((s) => s.key === statusFilter)?.archived ?? "false";

  const { data, isLoading } = useQuery({
    queryKey: ["farmers", { search, barangay, page, archivedParam }],
    queryFn: () => farmersApi.list({
      search: search || undefined,
      barangay: barangay || undefined,
      archived: archivedParam,
      page,
    }),
  });

  const rows = data?.results ?? [];

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, mobile, or ID…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-white outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]"
            aria-label="Search farmers"
          />
        </div>

        {/* Segmented status filter — design-system style */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map(({ key, label }) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => { setStatusFilter(key); setPage(1); }}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                  active
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <select
          value={barangay}
          onChange={(e) => { setBarangay(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]"
          aria-label="Filter by barangay"
        >
          <option value="">All barangays</option>
          {BAUANG_BARANGAYS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        {data && (
          <span className="ml-auto text-xs text-gray-500 tabular-nums">
            {rows.length.toLocaleString()} of {data.count.toLocaleString()}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50/60">
              <th className="px-4 py-2.5 font-semibold w-8" aria-label="Photo" />
              <th className="px-4 py-2.5 font-semibold">Farmer ID</th>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Barangay</th>
              <th className="px-4 py-2.5 font-semibold">Mobile</th>
              <th className="px-4 py-2.5 font-semibold">Livelihood</th>
              <th className="px-4 py-2.5 font-semibold">Flags</th>
              <th className="px-4 py-2.5 font-semibold">Verif.</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full max-w-[120px]" /></td>
                  ))}
                </tr>
              ))
            )}
            {!isLoading && rows.map((farmer) => {
              const status = farmer.is_archived ? "ARCHIVED" : "ACTIVE";
              const livelihood = LIVELIHOOD_LABELS[farmer.livelihood_type] ?? farmer.livelihood_type;
              return (
                <tr
                  key={farmer.id}
                  onClick={() => onSelect(farmer)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(farmer);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${farmer.full_name}'s profile`}
                  className={cn(
                    "hover:bg-[#EAF3DE] cursor-pointer transition-colors focus:outline-none focus-visible:bg-[#EAF3DE]",
                    farmer.is_archived && "opacity-70",
                  )}
                >
                  <td className="pl-4 pr-2 py-3">
                    <FarmerAvatar src={farmer.profile_photo} name={farmer.full_name} size={30} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 tabular-nums">
                    {formatFarmerId(farmer.id)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {farmer.full_name}
                    {farmer.encoded_by_name && (
                      <p className="text-[11px] font-normal text-gray-400 mt-0.5">
                        Encoded by {farmer.encoded_by_name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{farmer.barangay}</td>
                  <td className="px-4 py-3 text-gray-700 tabular-nums">{farmer.mobile_number}</td>
                  <td className="px-4 py-3 text-gray-700">{livelihood}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {!farmer.is_4ps && !farmer.is_pwd && !farmer.is_ip ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <>
                          {farmer.is_4ps && <Badge tone="navy">4Ps</Badge>}
                          {farmer.is_pwd && <Badge tone="navy">PWD</Badge>}
                          {farmer.is_ip && <Badge tone="navy">IP</Badge>}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <VerifBadge status={farmer.verification_status} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(status)} dot>
                      {status === "ACTIVE" ? "Active" : "Archived"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!isLoading && rows.length === 0 && (
          <EmptyState
            compact
            icon={<Users size={20} />}
            title={search || barangay ? "No farmers match" : "No farmers yet"}
            description={search || barangay
              ? "Try adjusting your search or filter."
              : statusFilter === "ARCHIVED"
                ? "Archived farmer profiles will appear here."
                : "Register your first farmer to get started."}
          />
        )}
      </div>

      {/* Pagination */}
      {data && data.count > rows.length && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="tabular-nums">Page {page}</span>
          <div className="flex gap-2">
            <button
              disabled={!data.previous}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-gray-200 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Prev
            </button>
            <button
              disabled={!data.next}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-200 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
