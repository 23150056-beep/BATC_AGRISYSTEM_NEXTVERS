import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { applicationsApi, type Application } from "../api/applications.api";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { cn } from "@/lib/utils";

export function ApplicationReviewPanel() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [selected, setSelected] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["applications", { status: statusFilter }],
    queryFn: () => applicationsApi.list({ status: statusFilter }),
    refetchOnWindowFocus: true,
  });

  // m-8: invalidate dashboard queries so pending_applications / fulfilled counts
  // refresh automatically after each status change.
  function invalidateDashboards() {
    qc.invalidateQueries({ queryKey: ["dashboard-admin"] });
    qc.invalidateQueries({ queryKey: ["dashboard-staff"] });
  }

  const approveMut = useMutation({
    mutationFn: (id: number) => applicationsApi.approve(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      invalidateDashboards();
      toast.success("Application approved — distribution scheduled.");
      setSelected(updated);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Approval failed."),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => applicationsApi.reject(id, reason),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      invalidateDashboards();
      toast.success("Application rejected.");
      setSelected(updated);
      setShowReject(false);
      setRejectReason("");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Rejection failed."),
  });

  const cancelMut = useMutation({
    mutationFn: (id: number) => applicationsApi.cancel(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      invalidateDashboards();
      toast.success("Application cancelled.");
      setSelected(updated);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Cancellation failed."),
  });

  const TABS = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED", "FULFILLED"];
  const isPending = approveMut.isPending || rejectMut.isPending || cancelMut.isPending;
  const canAct = selected && ["SUBMITTED", "UNDER_REVIEW"].includes(selected.status);

  return (
    <div className="flex h-full gap-0 border border-gray-200 rounded-xl overflow-hidden">
      {/* Left list */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 pt-4 pb-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {TABS.map((t) => (
                <button key={t} onClick={() => { setStatusFilter(t); setSelected(null); }}
                  className={cn("px-2 py-0.5 text-xs rounded-full border transition-colors",
                    statusFilter === t ? "bg-[#3B6D11] text-white border-[#3B6D11]" : "border-gray-300 text-gray-500 hover:border-gray-400")}>
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh list"
              className="p-1 text-gray-400 hover:text-[#3B6D11] disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {isLoading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
          {!isLoading && data?.results.length === 0 && (
            <p className="p-4 text-sm text-gray-400 italic">No applications.</p>
          )}
          {data?.results.map((app) => (
            <button key={app.id} onClick={() => setSelected(app)}
              className={cn("w-full text-left px-4 py-3 hover:bg-[#EAF3DE] transition-colors",
                selected?.id === app.id ? "bg-[#EAF3DE]" : "")}>
              <p className="font-medium text-sm text-gray-900 truncate">{app.farmer_name}</p>
              <p className="text-xs text-gray-500">{app.farmer_barangay}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">{app.program_code}</span>
                <ApplicationStatusBadge status={app.status} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right detail */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selected && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select an application to review.
          </div>
        )}
        {selected && (
          <div className="space-y-6 max-w-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selected.farmer_name}</h3>
                <p className="text-sm text-gray-500">{selected.farmer_barangay}</p>
              </div>
              <ApplicationStatusBadge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Program</p>
                <p className="font-medium text-gray-900">{selected.program_name}</p>
                <p className="text-xs text-gray-500 font-mono">{selected.program_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
                <p className="text-gray-700">{new Date(selected.submitted_at).toLocaleDateString()}</p>
              </div>
              {selected.reviewed_at && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reviewed</p>
                  <p className="text-gray-700">{new Date(selected.reviewed_at).toLocaleDateString()}</p>
                </div>
              )}
              {selected.reviewed_by_name && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Reviewed by</p>
                  <p className="text-gray-700">{selected.reviewed_by_name}</p>
                </div>
              )}
            </div>

            {selected.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <p className="font-medium mb-1">Rejection reason</p>
                {selected.rejection_reason}
              </div>
            )}

            {selected.notes && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                <p className="font-medium mb-1">Notes</p>
                {selected.notes}
              </div>
            )}

            {canAct && !showReject && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => approveMut.mutate(selected.id)}
                  disabled={isPending}
                  className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
                  style={{ backgroundColor: "#3B6D11" }}>
                  {approveMut.isPending ? "Approving…" : "Approve"}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={isPending}
                  className="px-5 py-2 text-sm border rounded-md text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-60">
                  Reject
                </button>
                <button
                  onClick={() => cancelMut.mutate(selected.id)}
                  disabled={isPending}
                  className="px-4 py-2 text-sm border rounded-md text-gray-500 disabled:opacity-60">
                  Cancel
                </button>
              </div>
            )}

            {canAct && showReject && (
              <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-md">
                <label className="block text-sm font-medium text-red-700">Rejection reason *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Explain why the application is being rejected…"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => rejectMut.mutate({ id: selected.id, reason: rejectReason })}
                    disabled={!rejectReason.trim() || isPending}
                    className="px-4 py-2 text-sm text-white bg-red-600 rounded-md disabled:opacity-60">
                    {rejectMut.isPending ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button onClick={() => setShowReject(false)} className="px-4 py-2 text-sm border rounded-md">Back</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
