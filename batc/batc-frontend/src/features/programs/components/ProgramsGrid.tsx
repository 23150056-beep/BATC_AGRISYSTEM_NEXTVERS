import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, Plus, Pencil, ChevronRight, Package, Users, MapPin, ShieldCheck,
  X, Calendar, type LucideIcon,
} from "lucide-react";
import { programsApi, type Program } from "../api/programs.api";
import { ProgramStatusBadge } from "./ProgramStatusBadge";
import { ProgramForm } from "./ProgramForm";
import { Button, Card, EmptyState, Skeleton, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type Tab = "ACTIVE" | "DRAFT" | "COMPLETED" | "SUSPENDED" | "ALL";

const TABS: { key: Tab; label: string }[] = [
  { key: "ACTIVE",    label: "Active" },
  { key: "DRAFT",     label: "Draft" },
  { key: "SUSPENDED", label: "Suspended" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ALL",       label: "All" },
];

const CRITERION_LABELS: Record<string, string> = {
  is_4ps:          "Must be 4Ps beneficiary",
  is_pwd:          "Must be PWD",
  is_ip:           "Must be Indigenous People",
  farm_area_ha:    "Farm area (ha)",
  livelihood_type: "Livelihood type",
  household_size:  "Household size",
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: "=", gte: "≥", lte: "≤", is_true: "must be Yes",
};

interface Props { isAdmin: boolean }

/* -------------------------------------------------------------------------- */

function formatWindow(start: string, end: string) {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  if (!start || !end) return "—";
  return `${fmt(start)} – ${fmt(end)}`;
}

function pct(num: number, denom: number) {
  if (!denom) return 0;
  return Math.min(100, Math.round((num / denom) * 100));
}

/* ----------------------------- Program card ------------------------------ */

function ProgramCard({
  program, onOpen, onEdit, isAdmin,
}: {
  program: Program;
  onOpen: () => void;
  onEdit: () => void;
  isAdmin: boolean;
}) {
  const apps = program.application_count ?? 0;
  const delivered = program.delivered_count ?? 0;
  const slots = Math.max(apps, delivered, 1); // visual scale: avoid /0
  const showProgress = apps > 0 || program.status === "ACTIVE";
  const deliveredPct = pct(delivered, Math.max(apps, slots));
  const overCapacity = apps > slots && program.status !== "DRAFT";

  return (
    <Card className="p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wide">{program.code}</p>
            {program.source_agency && (
              <span className="text-[10px] text-gray-400">· {program.source_agency}</span>
            )}
          </div>
          <p className="font-semibold text-gray-900 mt-1 leading-tight">{program.name}</p>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <Calendar size={11} className="text-gray-400 shrink-0" aria-hidden="true" />
            {formatWindow(program.start_date, program.end_date)}
          </p>
        </div>
        <ProgramStatusBadge status={program.status} />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Package size={11} className="text-gray-400" />
          <span className="tabular-nums">{program.item_count}</span>
          <span>item{program.item_count === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <MapPin size={11} className="text-gray-400" />
          <span>
            {program.target_barangays.length === 0
              ? "All barangays"
              : `${program.target_barangays.length} barangay${program.target_barangays.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>

      {showProgress && (
        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>Applications</span>
            <span className="tabular-nums">
              {apps.toLocaleString()} received · {delivered.toLocaleString()} delivered
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden flex">
            <div
              className="h-full transition-all"
              style={{
                width: `${deliveredPct}%`,
                background: "var(--color-brand-600)",
              }}
              aria-label={`${deliveredPct}% delivered`}
            />
            {!overCapacity && apps > delivered && (
              <div
                className="h-full transition-all"
                style={{
                  width: `${pct(apps - delivered, Math.max(apps, slots))}%`,
                  background: "var(--color-brand-500)",
                  opacity: 0.45,
                }}
              />
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5 -mx-4 px-4">
          <span className="text-[11px] text-gray-400 inline-flex items-center gap-1 group-hover:text-[var(--color-brand-600)] transition-colors">
            View details <ChevronRight size={11} />
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 -m-1 text-gray-400 hover:text-[var(--color-brand-600)] rounded"
            aria-label="Edit program"
          >
            <Pencil size={13} />
          </button>
        </div>
      )}
    </Card>
  );
}

/* ----------------------------- Detail drawer ----------------------------- */

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={12} className="text-[var(--color-brand-600)]" />
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{label}</p>
      </div>
      {children}
    </div>
  );
}

function ProgramDetailDrawer({
  programId, onClose, onEdit, isAdmin,
  onActivate, onSuspend, onComplete,
  busyStatus,
}: {
  programId: number;
  onClose: () => void;
  onEdit: (p: Program) => void;
  isAdmin: boolean;
  onActivate: (id: number) => void;
  onSuspend: (id: number) => void;
  onComplete: (id: number) => void;
  busyStatus: "activate" | "suspend" | "complete" | null;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["program-detail", programId],
    queryFn: () => programsApi.retrieve(programId),
    staleTime: 60_000,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="program-detail-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-lg bg-white shadow-xl border-l border-gray-200 flex flex-col h-full overflow-hidden">
        <header className="px-5 py-4 border-b border-gray-200 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] text-gray-400 uppercase tracking-wide">
              {data?.code ?? `#${programId}`}
            </p>
            <h2 id="program-detail-title" className="text-base font-semibold text-gray-900 mt-1 leading-tight">
              {data?.name ?? "Program"}
            </h2>
            {data && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <Calendar size={11} aria-hidden="true" />
                {formatWindow(data.start_date, data.end_date)}
              </p>
            )}
          </div>
          {data && <ProgramStatusBadge status={data.status} />}
          <button
            onClick={onClose}
            className="p-1 -m-1 text-gray-400 hover:text-gray-700 rounded shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isLoading || !data ? (
            <div className="space-y-3">
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Applications</p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5 tabular-nums">
                    {(data.application_count ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-[#EAF3DE] border border-[#D6E8BF] p-3">
                  <p className="text-[10px] text-[#3B6D11] uppercase tracking-wide">Delivered</p>
                  <p className="text-lg font-bold text-[#27500A] mt-0.5 tabular-nums">
                    {(data.delivered_count ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-[#E6F1FB] border border-[#cfe1f4] p-3">
                  <p className="text-[10px] text-[#0C447C] uppercase tracking-wide">Eligible</p>
                  <p className="text-lg font-bold text-[#0C447C] mt-0.5 tabular-nums">
                    {data.eligible_farmer_count?.toLocaleString() ?? "—"}
                  </p>
                </div>
              </div>

              <DetailRow icon={Package} label="Items per beneficiary">
                {data.items && data.items.length > 0 ? (
                  <ul className="space-y-1">
                    {data.items.map((item) => (
                      <li key={item.id} className="text-xs text-gray-700 flex items-baseline gap-1">
                        <span className="font-semibold text-[var(--color-brand-600)] tabular-nums">
                          {item.qty_per_beneficiary}
                        </span>
                        <span className="text-gray-500">{item.inventory_item_detail?.unit}</span>
                        <span>{item.inventory_item_detail?.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">No items defined.</p>
                )}
              </DetailRow>

              <DetailRow icon={ShieldCheck} label="Eligibility criteria">
                {data.criteria && data.criteria.length > 0 ? (
                  <ul className="space-y-1">
                    {data.criteria.map((c, idx) => (
                      <li key={idx} className="text-xs text-gray-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] shrink-0" />
                        <span>{CRITERION_LABELS[c.field] ?? c.field}</span>
                        {c.operator !== "is_true" && (
                          <>
                            <span className="text-gray-400">{OPERATOR_LABELS[c.operator] ?? c.operator}</span>
                            <span className="font-medium">{c.value}</span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic">Open to all eligible farmers.</p>
                )}
              </DetailRow>

              <DetailRow icon={MapPin} label="Target barangays">
                {data.target_barangays && data.target_barangays.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {data.target_barangays.map((b) => (
                      <span key={b} className="px-2 py-0.5 bg-white border border-[#C5DFA0] text-xs text-[var(--color-brand-600)] rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Badge tone="green">All barangays</Badge>
                )}
              </DetailRow>
            </>
          )}
        </div>

        {isAdmin && data && (
          <footer className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil size={12} />}
              onClick={() => onEdit(data)}
            >
              Edit
            </Button>
            <div className="flex-1" />
            {data.status === "DRAFT" && (
              <Button size="sm" loading={busyStatus === "activate"} onClick={() => onActivate(data.id)}>
                Activate
              </Button>
            )}
            {data.status === "ACTIVE" && (
              <>
                <Button variant="warning" size="sm" loading={busyStatus === "suspend"} onClick={() => onSuspend(data.id)}>
                  Suspend
                </Button>
                <Button variant="secondary" size="sm" loading={busyStatus === "complete"} onClick={() => onComplete(data.id)}>
                  Complete
                </Button>
              </>
            )}
            {data.status === "SUSPENDED" && (
              <Button size="sm" loading={busyStatus === "activate"} onClick={() => onActivate(data.id)}>
                Re-activate
              </Button>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}

/* -------------------------------- Page ----------------------------------- */

export function ProgramsGrid({ isAdmin }: Props) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("ACTIVE");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["programs", { search, tab }],
    queryFn: () => programsApi.list({
      search: search || undefined,
      status: tab === "ALL" ? undefined : tab,
    }),
  });

  const activateMut = useMutation({
    mutationFn: (id: number) => programsApi.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); qc.invalidateQueries({ queryKey: ["program-detail"] }); toast.success("Program activated."); },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed to activate program."),
  });
  const suspendMut = useMutation({
    mutationFn: (id: number) => programsApi.suspend(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); qc.invalidateQueries({ queryKey: ["program-detail"] }); toast.success("Program suspended."); },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed to suspend program."),
  });
  const completeMut = useMutation({
    mutationFn: (id: number) => programsApi.complete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); qc.invalidateQueries({ queryKey: ["program-detail"] }); toast.success("Program marked complete."); },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed to complete program."),
  });

  const busyStatus = activateMut.isPending ? "activate"
    : suspendMut.isPending ? "suspend"
    : completeMut.isPending ? "complete"
    : null;

  const counts = useMemo(() => {
    const all = data?.results ?? [];
    return {
      ACTIVE:    all.filter((p) => p.status === "ACTIVE").length,
      DRAFT:     all.filter((p) => p.status === "DRAFT").length,
      SUSPENDED: all.filter((p) => p.status === "SUSPENDED").length,
      COMPLETED: all.filter((p) => p.status === "COMPLETED").length,
      ALL:       all.length,
    };
  }, [data]);

  return (
    <>
      {/* Toolbar: tabs + search + new */}
      <div className="flex items-end justify-between flex-wrap gap-3 border-b border-gray-200 mb-4">
        <div className="flex gap-1" role="tablist" aria-label="Filter programs by status">
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            const count = tab === key && data ? counts[key] : undefined;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  active ? "text-[var(--color-brand-600)]" : "text-gray-500 hover:text-gray-800",
                )}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1.5 text-[10px] tabular-nums opacity-70">({count})</span>
                )}
                {active && (
                  <span
                    className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full"
                    style={{ background: "var(--color-brand-600)" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs…"
              className="w-56 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/40 focus:border-[var(--color-brand-500)]"
              aria-label="Search programs"
            />
          </div>
          {isAdmin && (
            <Button leftIcon={<Plus size={14} strokeWidth={2.25} />} onClick={() => setCreating(true)}>
              New program
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : isError ? (
        <Card>
          <EmptyState
            title="Couldn't load programs"
            description={(error as any)?.response?.data?.detail ?? (error as any)?.message ?? "Try refreshing the page."}
          />
        </Card>
      ) : data?.results.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={22} />}
            title={tab === "ALL" ? "No programs yet" : `No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} programs`}
            description={isAdmin ? "Create a program to start accepting applications." : "Check back soon — new programs will appear here."}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {data?.results.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              isAdmin={isAdmin}
              onOpen={() => setOpenId(p.id)}
              onEdit={() => setEditing(p)}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {openId !== null && (
        <ProgramDetailDrawer
          programId={openId}
          isAdmin={isAdmin}
          busyStatus={busyStatus}
          onClose={() => setOpenId(null)}
          onEdit={(p) => { setEditing(p); setOpenId(null); }}
          onActivate={(id) => activateMut.mutate(id)}
          onSuspend={(id) => suspendMut.mutate(id)}
          onComplete={(id) => completeMut.mutate(id)}
        />
      )}

      {/* Create / edit modal */}
      {(creating || editing) && (
        <ProgramForm
          program={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

    </>
  );
}
