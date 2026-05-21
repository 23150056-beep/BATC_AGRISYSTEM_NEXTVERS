import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  Clock, CheckCircle2, XCircle, RefreshCw, Truck, Inbox, AlertCircle, X,
} from "lucide-react";
import { applicationsApi, type Application } from "@/features/applications/api/applications.api";
import { cn } from "@/lib/utils";
import { useState } from "react";

const STATUS_META: Record<Application["status"], {
  label: string; color: string; bg: string; icon: any; description: string;
}> = {
  SUBMITTED:    { label: "Submitted",    color: "text-[var(--color-info)]",    bg: "bg-[var(--color-info-soft)]",    icon: Clock,         description: "We received your application and it is in queue for review." },
  UNDER_REVIEW: { label: "Under Review", color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning-soft)]", icon: RefreshCw,     description: "A staff member is reviewing your eligibility right now." },
  APPROVED:     { label: "Approved",     color: "text-[var(--color-success)]", bg: "bg-[var(--color-success-soft)]", icon: CheckCircle2,  description: "Your application was approved. Watch the Claims tab for the pickup schedule." },
  REJECTED:     { label: "Not Approved", color: "text-[var(--color-danger)]",  bg: "bg-[var(--color-danger-soft)]",  icon: XCircle,       description: "Your application was not approved this round." },
  CANCELLED:    { label: "Cancelled",    color: "text-gray-500",                bg: "bg-gray-100",                     icon: X,             description: "You cancelled this application." },
  FULFILLED:    { label: "Fulfilled",    color: "text-[var(--color-success)]", bg: "bg-[var(--color-success-soft)]", icon: Truck,         description: "Pickup completed. Please leave feedback." },
};

const TIMELINE_STAGES: Application["status"][] = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "FULFILLED"];

function StageDot({ done, current, failed, icon: Icon }: { done: boolean; current: boolean; failed?: boolean; icon: any }) {
  return (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ring-4 transition-colors",
      failed ? "bg-[var(--color-danger)] ring-[var(--color-danger-soft)]" :
      current ? "bg-[var(--color-brand-600)] ring-[var(--color-brand-100)]" :
      done    ? "bg-[var(--color-success)] ring-[var(--color-success-soft)]" :
                "bg-gray-200 ring-gray-100"
    )}>
      <Icon size={13} />
    </div>
  );
}

function ApplicationDetail({ app, onClose }: { app: Application; onClose: () => void }) {
  const qc = useQueryClient();
  const cancelMut = useMutation({
    mutationFn: () => applicationsApi.cancel(app.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications-mine"] });
      toast.success("Application cancelled.");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Could not cancel."),
  });

  const meta = STATUS_META[app.status];
  const isRejected = app.status === "REJECTED";
  const isCancelled = app.status === "CANCELLED";
  const currentStage = TIMELINE_STAGES.indexOf(app.status);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="font-semibold text-gray-900 text-sm">Application Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto p-5 space-y-5">
            {/* Header */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{app.program_name}</h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{app.program_code}</p>
              <span className={cn("inline-flex items-center gap-1 mt-2 px-2 py-1 text-xs font-medium rounded-full", meta.bg, meta.color)}>
                <meta.icon size={11} /> {meta.label}
              </span>
            </div>

            {/* Status description */}
            <div className={cn("rounded-lg p-3 text-sm", meta.bg, meta.color)}>
              {meta.description}
            </div>

            {/* Rejection reason */}
            {isRejected && app.rejection_reason && (
              <div className="bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 rounded-lg p-4">
                <p className="text-xs font-semibold text-[var(--color-danger)] uppercase tracking-wide mb-1 flex items-center gap-1">
                  <AlertCircle size={11} /> Reason
                </p>
                <p className="text-sm text-gray-700">{app.rejection_reason}</p>
              </div>
            )}

            {/* Status Timeline */}
            {!isCancelled && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Progress</p>
                <ol className="relative space-y-4 pl-1">
                  {TIMELINE_STAGES.map((stage, i) => {
                    const done = i < currentStage || (isRejected ? i < currentStage : false);
                    const current = i === currentStage;
                    const skippedAfterReject = isRejected && i > currentStage;
                    const Icon = STATUS_META[stage].icon;
                    return (
                      <li key={stage} className="flex items-start gap-3">
                        <StageDot
                          done={done}
                          current={current}
                          failed={isRejected && current}
                          icon={isRejected && current ? XCircle : Icon}
                        />
                        <div className="flex-1 -mt-0.5">
                          <p className={cn("text-sm font-medium",
                            skippedAfterReject ? "text-gray-300" :
                            current ? "text-gray-900" :
                            done ? "text-gray-700" : "text-gray-400"
                          )}>
                            {STATUS_META[stage].label}
                          </p>
                          {current && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {stage === "SUBMITTED"    && `Submitted ${formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true })}`}
                              {stage === "UNDER_REVIEW" && app.reviewed_at && `Started ${formatDistanceToNow(new Date(app.reviewed_at), { addSuffix: true })}`}
                              {stage === "APPROVED"     && app.reviewed_at && `Approved ${format(new Date(app.reviewed_at), "MMM d, yyyy")}`}
                              {stage === "FULFILLED"    && "Pickup completed"}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Meta */}
            <div className="border-t border-gray-100 pt-4 space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between"><span>Submitted</span><span className="text-gray-700">{format(new Date(app.submitted_at), "MMM d, yyyy HH:mm")}</span></div>
              {app.reviewed_at && <div className="flex justify-between"><span>Reviewed</span><span className="text-gray-700">{format(new Date(app.reviewed_at), "MMM d, yyyy HH:mm")}</span></div>}
              {app.reviewed_by_name && <div className="flex justify-between"><span>Reviewer</span><span className="text-gray-700">{app.reviewed_by_name}</span></div>}
            </div>

            {app.status === "SUBMITTED" && (
              <button
                onClick={() => cancelMut.mutate()}
                disabled={cancelMut.isPending}
                className="w-full py-2 text-sm border border-[var(--color-danger)] text-[var(--color-danger)] rounded-lg hover:bg-[var(--color-danger-soft)] disabled:opacity-50"
              >
                {cancelMut.isPending ? "Cancelling…" : "Cancel Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function ClientApplicationsPage() {
  const [selected, setSelected] = useState<Application | null>(null);
  const { data: apps, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["applications-mine"],
    queryFn:  applicationsApi.mine,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="p-4 md:p-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-brand-600)]">Applications</p>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mt-1">My Applications</h2>
          <p className="text-xs text-gray-500 mt-0.5">Track every application you've submitted.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-gray-400 hover:text-[var(--color-brand-600)] disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && apps?.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl py-10 px-4 text-center">
          <Inbox className="mx-auto text-gray-300 mb-2" size={36} />
          <p className="text-sm font-medium text-gray-700">No applications yet</p>
          <p className="text-xs text-gray-400 mt-1">Browse the Programs tab to apply for assistance.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {apps?.map((app) => {
          const meta = STATUS_META[app.status];
          return (
            <button
              key={app.id}
              onClick={() => setSelected(app)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-[var(--color-brand-600)]/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{app.program_name}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{app.program_code}</p>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Submitted {formatDistanceToNow(new Date(app.submitted_at), { addSuffix: true })}
                  </p>
                </div>
                <span className={cn("inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full shrink-0", meta.bg, meta.color)}>
                  <meta.icon size={11} /> {meta.label}
                </span>
              </div>
              {app.status === "REJECTED" && app.rejection_reason && (
                <p className="text-xs text-[var(--color-danger)] mt-2 line-clamp-1">⚠ {app.rejection_reason}</p>
              )}
            </button>
          );
        })}
      </div>

      {selected && <ApplicationDetail app={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
