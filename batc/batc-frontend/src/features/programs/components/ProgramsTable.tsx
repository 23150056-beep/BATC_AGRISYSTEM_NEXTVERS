import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus, Pencil, ChevronRight, Package, Users, MapPin, ShieldCheck } from "lucide-react";
import { programsApi, type Program } from "../api/programs.api";
import { ProgramStatusBadge } from "./ProgramStatusBadge";
import { ProgramForm } from "./ProgramForm";

const STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED"];

const CRITERION_LABELS: Record<string, string> = {
  is_4ps:          "Must be 4Ps beneficiary",
  is_pwd:          "Must be PWD",
  is_ip:           "Must be Indigenous People",
  farm_area_ha:    "Farm area (ha)",
  livelihood_type: "Livelihood type",
  household_size:  "Household size",
};

const OPERATOR_LABELS: Record<string, string> = {
  eq:      "=",
  gte:     "≥",
  lte:     "≤",
  is_true: "must be Yes",
};

interface Props { isAdmin: boolean }

/** Expanded detail row — fetches program detail lazily */
function ProgramDetailRow({ programId, colSpan }: { programId: number; colSpan: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["program-detail", programId],
    queryFn:  () => programsApi.retrieve(programId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-8 py-4 bg-[#F7FAF3] border-t border-[#D6E8BF]">
          <p className="text-xs text-gray-400">Loading details…</p>
        </td>
      </tr>
    );
  }

  if (!data) return null;

  return (
    <tr>
      <td colSpan={colSpan} className="bg-[#F7FAF3] border-t border-[#D6E8BF]">
        <div className="px-8 py-4 grid grid-cols-3 gap-6">

          {/* Items */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Package size={12} className="text-[#3B6D11]" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Items per Beneficiary
              </p>
            </div>
            {data.items && data.items.length > 0 ? (
              <ul className="space-y-1">
                {data.items.map((item) => (
                  <li key={item.id} className="text-xs text-gray-700 flex items-baseline gap-1">
                    <span className="font-medium text-[#3B6D11]">{item.qty_per_beneficiary}</span>
                    <span className="text-gray-500">{item.inventory_item_detail?.unit}</span>
                    <span>{item.inventory_item_detail?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 italic">No items defined.</p>
            )}
          </div>

          {/* Eligibility criteria */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck size={12} className="text-[#3B6D11]" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Eligibility Criteria
              </p>
            </div>
            {data.criteria && data.criteria.length > 0 ? (
              <ul className="space-y-1">
                {data.criteria.map((c, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#639922] shrink-0" />
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
          </div>

          {/* Target barangays */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={12} className="text-[#3B6D11]" />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Target Barangays
              </p>
            </div>
            {data.target_barangays && data.target_barangays.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.target_barangays.map((b) => (
                  <span key={b} className="px-2 py-0.5 bg-white border border-[#C5DFA0] text-xs text-[#3B6D11] rounded-full">
                    {b}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">All barangays.</p>
            )}
          </div>

        </div>
      </td>
    </tr>
  );
}

export function ProgramsTable({ isAdmin }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["programs", { search, status }],
    queryFn: () => programsApi.list({ search: search || undefined, status: status || undefined }),
  });

  const activateMut = useMutation({
    mutationFn: (id: number) => programsApi.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); toast.success("Program activated."); },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed."),
  });

  const suspendMut = useMutation({
    mutationFn: (id: number) => programsApi.suspend(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); toast.success("Program suspended."); },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed."),
  });

  const completeMut = useMutation({
    mutationFn: (id: number) => programsApi.complete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["programs"] }); toast.success("Program completed."); },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed."),
  });

  const colSpan = isAdmin ? 7 : 6;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search programs…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#639922]" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#639922]">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md ml-auto"
              style={{ backgroundColor: "#3B6D11" }}>
              <Plus size={14} /> New Program
            </button>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Program</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Period</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Users size={11} /> Eligible
                  </div>
                </th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && (
                <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              )}
              {isError && (
                <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-red-500 text-xs">
                  {(error as any)?.response?.data?.detail ?? (error as any)?.message ?? "Failed to load programs."}
                </td></tr>
              )}
              {!isLoading && !isError && data?.results?.length === 0 && (
                <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">No programs found.</td></tr>
              )}

              {data?.results?.map((program) => (
                <>
                  {/* Main row */}
                  <tr
                    key={program.id}
                    onClick={() => setExpanded(expanded === program.id ? null : program.id)}
                    className="hover:bg-[#EAF3DE] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-1.5">
                        <ChevronRight
                          size={13}
                          className={`transition-transform duration-200 text-gray-400 ${expanded === program.id ? "rotate-90" : ""}`}
                        />
                        <span>{program.name}</span>
                      </div>
                      {program.source_agency && (
                        <p className="text-xs text-gray-400 ml-5">{program.source_agency}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{program.code}</td>
                    <td className="px-4 py-3"><ProgramStatusBadge status={program.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{program.start_date} – {program.end_date}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{program.item_count}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{program.eligible_farmer_count ?? "—"}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditing(program)}
                            className="p-1 text-gray-400 hover:text-[#3B6D11]">
                            <Pencil size={13} />
                          </button>
                          {program.status === "DRAFT" && (
                            <button onClick={() => activateMut.mutate(program.id)}
                              className="px-2 py-0.5 text-xs text-white rounded"
                              style={{ backgroundColor: "#3B6D11" }}>
                              Activate
                            </button>
                          )}
                          {program.status === "ACTIVE" && (
                            <>
                              <button onClick={() => suspendMut.mutate(program.id)}
                                className="px-2 py-0.5 text-xs border rounded text-amber-700 border-amber-300">
                                Suspend
                              </button>
                              <button onClick={() => completeMut.mutate(program.id)}
                                className="px-2 py-0.5 text-xs border rounded text-blue-700 border-blue-300">
                                Complete
                              </button>
                            </>
                          )}
                          {program.status === "SUSPENDED" && (
                            <button onClick={() => activateMut.mutate(program.id)}
                              className="px-2 py-0.5 text-xs text-white rounded"
                              style={{ backgroundColor: "#3B6D11" }}>
                              Re-activate
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expanded detail row */}
                  {expanded === program.id && (
                    <ProgramDetailRow
                      key={`detail-${program.id}`}
                      programId={program.id}
                      colSpan={colSpan}
                    />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <ProgramForm
          program={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </>
  );
}
