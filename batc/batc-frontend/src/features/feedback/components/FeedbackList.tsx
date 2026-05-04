import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { feedbackApi } from "../api/feedback.api";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statusStyle: Record<string, string> = {
  NEW:          "bg-[#E6F1FB] text-[#0C447C]",
  ACKNOWLEDGED: "bg-[#FAEEDA] text-[#633806]",
  RESOLVED:     "bg-[#EAF3DE] text-[#27500A]",
};

export function FeedbackList() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["feedback", { status: statusFilter }],
    queryFn: () => feedbackApi.list({ status: statusFilter || undefined }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => feedbackApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feedback"] }); toast.success("Status updated."); },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["", "NEW", "ACKNOWLEDGED", "RESOLVED"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1 text-xs rounded-full border transition-colors",
              statusFilter === s ? "bg-[#3B6D11] text-white border-[#3B6D11]" : "border-gray-300 text-gray-500")}>
            {s || "All"}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && data?.results.length === 0 && (
        <p className="text-sm text-gray-400 italic">No feedback yet.</p>
      )}

      <div className="space-y-3">
        {data?.results.map((fb) => (
          <div key={fb.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{fb.farmer_name}</p>
                {fb.program_name && <p className="text-xs text-gray-400">{fb.program_name}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("px-2 py-0.5 text-xs rounded font-medium", statusStyle[fb.status])}>
                  {fb.status}
                </span>
              </div>
            </div>

            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={14}
                  className={fb.rating >= s ? "text-amber-400 fill-amber-400" : "text-gray-200"} />
              ))}
              <span className="text-xs text-gray-500 ml-1 self-center">{fb.rating}/5</span>
            </div>

            {fb.comment && <p className="text-sm text-gray-700">{fb.comment}</p>}
            <p className="text-xs text-gray-400">{new Date(fb.created_at).toLocaleDateString()}</p>

            {fb.status !== "RESOLVED" && (
              <div className="flex gap-2 pt-1">
                {fb.status === "NEW" && (
                  <button onClick={() => updateMut.mutate({ id: fb.id, status: "ACKNOWLEDGED" })}
                    className="text-xs px-2 py-1 border rounded text-gray-600 hover:bg-gray-50">
                    Acknowledge
                  </button>
                )}
                <button onClick={() => updateMut.mutate({ id: fb.id, status: "RESOLVED" })}
                  className="text-xs px-2 py-1 border rounded text-[#3B6D11] border-[#3B6D11] hover:bg-[#EAF3DE]">
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
