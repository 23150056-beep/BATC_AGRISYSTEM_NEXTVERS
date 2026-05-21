import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, RefreshCw, MessageSquare, CheckCheck, Clock, AlertTriangle, Send, CornerDownRight } from "lucide-react";
import { feedbackApi, type Feedback, ISSUE_TYPE_LABELS } from "../api/feedback.api";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["ALL", "QUALITY", "NEW", "ACKNOWLEDGED", "RESOLVED"] as const;
type StatusTab = typeof STATUS_TABS[number];

const statusStyle: Record<string, string> = {
  NEW:          "bg-[#E6F1FB] text-[#0C447C]",
  ACKNOWLEDGED: "bg-[#FAEEDA] text-[#633806]",
  RESOLVED:     "bg-[#EAF3DE] text-[#27500A]",
};

const issueTypeStyle: Record<string, string> = {
  DAMAGED:        "bg-red-100 text-red-700",
  EXPIRED:        "bg-red-100 text-red-700",
  WRONG_QUANTITY: "bg-orange-100 text-orange-700",
  WRONG_ITEM:     "bg-orange-100 text-orange-700",
  GENERAL:        "bg-gray-100 text-gray-600",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={13}
          className={rating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}/5</span>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center">
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export function FeedbackManagementPanel() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<StatusTab>("ALL");
  const [selected, setSelected] = useState<Feedback | null>(null);

  const isAllTab = tab === "ALL";
  const queryParams =
    isAllTab          ? {} :
    tab === "QUALITY" ? { quality: "true" } :
                        { status: tab };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["feedback", queryParams],
    queryFn: () => feedbackApi.list(queryParams),
    refetchOnWindowFocus: true,
  });

  // M-12: when tab is "ALL", queryParams is {} — same key as allData below.
  // React Query deduplicates identical keys, but having two separate useQuery
  // calls still produces two subscription objects. Avoid the conceptual
  // redundancy: when on the ALL tab, reuse `data` for stats; only fire a
  // separate all-data fetch when a filter is active (to keep counts accurate).
  const { data: allData } = useQuery({
    queryKey: ["feedback", {} as Record<string, string>],
    queryFn:  () => feedbackApi.list({}),
    enabled:  !isAllTab, // ALL tab already fetched everything in `data`
  });

  const { data: alertData } = useQuery({
    queryKey: ["feedback-quality-count"],
    queryFn:  () => feedbackApi.qualityAlertCount(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      feedbackApi.updateStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      qc.invalidateQueries({ queryKey: ["feedback-quality-count"] });
      setSelected(updated);
      toast.success("Feedback status updated.");
    },
    onError: () => toast.error("Failed to update status."),
  });

  const [draft, setDraft] = useState("");
  // Reset the draft whenever the user picks a different feedback so we don't
  // accidentally cross-post a reply intended for another farmer.
  useEffect(() => { setDraft(""); }, [selected?.id]);

  const replyMut = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      feedbackApi.reply(id, message),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["feedback"] });
      qc.invalidateQueries({ queryKey: ["feedback-quality-count"] });
      setSelected(updated);
      setDraft("");
      toast.success("Reply sent. The farmer will be notified.");
    },
    onError: (err: any) => {
      const detail =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        "Failed to send reply.";
      toast.error(typeof detail === "string" ? detail : "Failed to send reply.");
    },
  });

  const results = data?.results ?? [];
  // When tab is ALL, use the main query's result for stats (no extra fetch needed).
  const all     = (isAllTab ? data : allData)?.results ?? [];
  const unresolvedQuality = alertData?.count ?? 0;

  const totalNew = all.filter((f) => f.status === "NEW").length;
  const totalAck = all.filter((f) => f.status === "ACKNOWLEDGED").length;
  const totalRes = all.filter((f) => f.status === "RESOLVED").length;
  const avgRating = all.length
    ? (all.reduce((sum, f) => sum + f.rating, 0) / all.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-4">
      {/* Quality alert banner */}
      {unresolvedQuality > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              {unresolvedQuality} Unresolved Quality {unresolvedQuality === 1 ? "Issue" : "Issues"}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Farmers have reported damaged, expired, or incorrect items. Review and resolve these promptly.
            </p>
          </div>
          <button
            onClick={() => { setTab("QUALITY"); setSelected(null); }}
            className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 shrink-0"
          >
            View Issues
          </button>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="New"          value={totalNew} color="text-[#0C447C]" />
        <SummaryCard label="Acknowledged" value={totalAck} color="text-[#633806]" />
        <SummaryCard label="Resolved"     value={totalRes} color="text-[#27500A]" />
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-500">{avgRating}</p>
          <p className="text-xs text-gray-500 mt-0.5">Avg Rating</p>
        </div>
      </div>

      <div className="flex gap-0 border border-gray-200 rounded-xl overflow-hidden min-h-[420px]">
        {/* Left list */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
          <div className="px-3 pt-3 pb-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Feedback</p>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
                className="p-1 text-gray-400 hover:text-[#3B6D11] disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSelected(null); }}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full border transition-colors flex items-center gap-1",
                    t === "QUALITY"
                      ? tab === t
                        ? "bg-red-600 text-white border-red-600"
                        : "border-red-300 text-red-600 hover:bg-red-50"
                      : tab === t
                        ? "bg-[#3B6D11] text-white border-[#3B6D11]"
                        : "border-gray-300 text-gray-500 hover:border-gray-400"
                  )}
                >
                  {t === "QUALITY" && <AlertTriangle size={9} />}
                  {t === "ALL"     ? "All" :
                   t === "QUALITY" ? "Quality Issues" :
                   t.charAt(0) + t.slice(1).toLowerCase()}
                  {t === "QUALITY" && unresolvedQuality > 0 && (
                    <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {unresolvedQuality > 9 ? "9+" : unresolvedQuality}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading && <p className="p-4 text-sm text-gray-400">Loading…</p>}
            {!isLoading && results.length === 0 && (
              <p className="p-4 text-sm text-gray-400 italic">No feedback found.</p>
            )}
            {results.map((fb) => (
              <button
                key={fb.id}
                onClick={() => setSelected(fb)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-[#EAF3DE] transition-colors",
                  selected?.id === fb.id ? "bg-[#EAF3DE]" : "",
                  fb.is_quality_issue ? "border-l-2 border-red-400" : ""
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {fb.is_quality_issue && (
                      <AlertTriangle size={11} className="text-red-500 shrink-0" />
                    )}
                    <p className="font-medium text-sm text-gray-900 truncate">{fb.farmer_name}</p>
                  </div>
                  <span className={cn("px-1.5 py-0.5 text-xs rounded font-medium shrink-0", statusStyle[fb.status])}>
                    {fb.status === "ACKNOWLEDGED" ? "ACK" : fb.status}
                  </span>
                </div>
                <p className={cn("text-xs mt-0.5 truncate", fb.is_quality_issue ? "text-red-600 font-medium" : "text-gray-400")}>
                  {ISSUE_TYPE_LABELS[fb.issue_type]}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={10}
                        className={fb.rating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(fb.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex-1 p-6 overflow-y-auto bg-white">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <MessageSquare size={36} className="opacity-30" />
              <p className="text-sm">Select a feedback to review</p>
            </div>
          ) : (
            <div className="space-y-5 max-w-lg">
              {/* Quality alert header */}
              {selected.is_quality_issue && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
                  <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Quality Issue Report</p>
                    <p className="text-xs text-red-600">This requires prompt attention and resolution.</p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selected.farmer_name}</h3>
                  {selected.program_name && (
                    <p className="text-sm text-gray-500 mt-0.5">{selected.program_name}</p>
                  )}
                </div>
                <span className={cn("px-2.5 py-1 text-xs rounded-full font-medium", statusStyle[selected.status])}>
                  {selected.status}
                </span>
              </div>

              {/* Issue type + Rating */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Issue Type</p>
                  <span className={cn("px-2 py-1 text-xs rounded-md font-medium", issueTypeStyle[selected.issue_type])}>
                    {ISSUE_TYPE_LABELS[selected.issue_type]}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Rating</p>
                  <StarRating rating={selected.rating} />
                </div>
              </div>

              {/* Comment */}
              {selected.comment ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Farmer's Comment</p>
                  <p className={cn(
                    "text-sm rounded-lg p-4 leading-relaxed",
                    selected.is_quality_issue ? "bg-red-50 text-red-900 border border-red-100" : "bg-gray-50 text-gray-700"
                  )}>
                    "{selected.comment}"
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No comment provided.</p>
              )}

              {/* Meta */}
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Clock size={11} />
                Submitted {new Date(selected.created_at).toLocaleString()}
              </div>

              {/* Replies thread + composer */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <CornerDownRight size={13} className="text-[#3B6D11]" />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Replies{selected.replies?.length ? ` · ${selected.replies.length}` : ""}
                  </p>
                </div>

                {selected.replies && selected.replies.length > 0 ? (
                  <ul className="space-y-2 mb-3">
                    {selected.replies.map((r) => (
                      <li
                        key={r.id}
                        className="bg-[#F7FAF3] border border-[#D6E8BF] rounded-lg px-3 py-2"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-semibold text-[#27500A]">
                            {r.author_name}
                            {r.author_role && (
                              <span className="ml-1 font-normal text-gray-400 capitalize">
                                · {r.author_role.toLowerCase()}
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                            {new Date(r.created_at).toLocaleString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed mt-1 whitespace-pre-wrap">
                          {r.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 italic mb-3">
                    No replies yet. Send the first one — the farmer will be notified.
                  </p>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const msg = draft.trim();
                    if (!msg || replyMut.isPending) return;
                    replyMut.mutate({ id: selected.id, message: msg });
                  }}
                  className="space-y-2"
                >
                  <label htmlFor={`reply-${selected.id}`} className="sr-only">
                    Reply to {selected.farmer_name}
                  </label>
                  <textarea
                    id={`reply-${selected.id}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Cmd/Ctrl + Enter sends.
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        const msg = draft.trim();
                        if (!msg || replyMut.isPending) return;
                        replyMut.mutate({ id: selected.id, message: msg });
                      }
                    }}
                    placeholder={
                      selected.is_quality_issue
                        ? "Explain how the issue is being resolved…"
                        : "Reply to the farmer…"
                    }
                    rows={3}
                    maxLength={4000}
                    disabled={replyMut.isPending}
                    className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#639922]/40 focus:border-[#639922] resize-y disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-400">
                      The farmer is notified instantly · <kbd className="font-mono">⌘/Ctrl + Enter</kbd> to send
                    </p>
                    <button
                      type="submit"
                      disabled={replyMut.isPending || !draft.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md bg-[#3B6D11] hover:bg-[#2f560d] disabled:opacity-55 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm"
                    >
                      <Send size={12} strokeWidth={2.25} />
                      {replyMut.isPending ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Actions */}
              {selected.status !== "RESOLVED" && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {selected.status === "NEW" && (
                    <button
                      onClick={() => updateMut.mutate({ id: selected.id, status: "ACKNOWLEDGED" })}
                      disabled={updateMut.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50 disabled:opacity-60"
                    >
                      <CheckCheck size={14} />
                      Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => updateMut.mutate({ id: selected.id, status: "RESOLVED" })}
                    disabled={updateMut.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-md disabled:opacity-60"
                    style={{ backgroundColor: selected.is_quality_issue ? "#dc2626" : "#3B6D11" }}
                  >
                    <CheckCheck size={14} />
                    {updateMut.isPending ? "Saving…" : "Mark Resolved"}
                  </button>
                </div>
              )}

              {selected.status === "RESOLVED" && (
                <div className="flex items-center gap-2 text-sm text-[#27500A] bg-[#EAF3DE] px-4 py-3 rounded-lg">
                  <CheckCheck size={15} />
                  This feedback has been resolved.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
