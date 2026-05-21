import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { distributionApi, type Distribution } from "../api/distribution.api";
import { DistributionStatusBadge } from "./DistributionStatusBadge";
import { StatusUpdateDialog } from "./StatusUpdateDialog";

const STATUSES = ["SCHEDULED", "DELIVERED", "DELAYED", "RESCHEDULED", "OUT_OF_STOCK", "UNAVAILABLE"];

interface Props {
  isAdmin?: boolean;
}

export function DistributionTable({ isAdmin: _isAdmin }: Props) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<Distribution | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["distributions", { status: statusFilter }],
    queryFn: () => distributionApi.list({ status: statusFilter || undefined }),
    refetchOnWindowFocus: true,
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#639922]">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh list"
            className="p-2 text-gray-400 hover:text-[#3B6D11] disabled:opacity-40 transition-colors border border-gray-300 rounded-md"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Farmer</th>
                <th className="px-4 py-3 text-left">Barangay</th>
                <th className="px-4 py-3 text-left">Program</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Scheduled</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
              {!isLoading && data?.results.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No distributions found.</td></tr>
              )}
              {data?.results.map((dist) => (
                <tr key={dist.id} className="hover:bg-[#EAF3DE] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{dist.farmer_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{dist.farmer_barangay}</td>
                  <td className="px-4 py-3 text-xs">
                    <p className="text-gray-700">{dist.program_name}</p>
                    <p className="text-gray-400 font-mono">{dist.program_code}</p>
                  </td>
                  <td className="px-4 py-3"><DistributionStatusBadge status={dist.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{dist.scheduled_date ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {dist.items.map((i) => `${Number(i.quantity_planned)} ${i.unit} ${i.item_name}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {["SCHEDULED", "DELAYED", "RESCHEDULED"].includes(dist.status) && (
                      <button
                        onClick={() => setUpdating(dist)}
                        className="px-2 py-1 text-xs text-white rounded"
                        style={{ backgroundColor: "#3B6D11" }}>
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {updating && (
        <StatusUpdateDialog
          distribution={updating}
          onClose={() => setUpdating(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["distributions"] });
            // Status transitions move units between reserved / released /
            // unreserved — keep inventory + dashboards live across tabs.
            qc.invalidateQueries({ queryKey: ["inventory-items"] });
            qc.invalidateQueries({ queryKey: ["inventory-summary"] });
            qc.invalidateQueries({ queryKey: ["inventory-usage"] });
            qc.invalidateQueries({ queryKey: ["dashboard-admin"] });
            qc.invalidateQueries({ queryKey: ["dashboard-staff"] });
            qc.invalidateQueries({ queryKey: ["applications"] });
            setUpdating(null);
          }}
        />
      )}
    </>
  );
}
