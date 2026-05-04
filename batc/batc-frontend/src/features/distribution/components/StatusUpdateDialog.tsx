import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { distributionApi, type Distribution } from "../api/distribution.api";

const STATUSES = [
  { value: "DELIVERED",    label: "Delivered",     style: "bg-[#EAF3DE] text-[#27500A] border-[#27500A]" },
  { value: "DELAYED",      label: "Delayed",       style: "bg-[#FAEEDA] text-[#633806] border-[#633806]" },
  { value: "RESCHEDULED",  label: "Rescheduled",   style: "bg-[#F1EFE8] text-[#444441] border-[#444441]" },
  { value: "OUT_OF_STOCK", label: "Out of Stock",  style: "bg-[#FCEBEB] text-[#791F1F] border-[#791F1F]" },
  { value: "UNAVAILABLE",  label: "Unavailable",   style: "bg-[#FCEBEB] text-[#791F1F] border-[#791F1F]" },
];

interface Props {
  distribution: Distribution;
  onClose: () => void;
  onSaved: (updated: Distribution) => void;
}

export function StatusUpdateDialog({ distribution, onClose, onSaved }: Props) {
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [scheduledDate, setScheduledDate] = useState(distribution.scheduled_date ?? "");

  const mut = useMutation({
    mutationFn: () => distributionApi.updateStatus(distribution.id, {
      new_status: newStatus,
      remarks,
      ...(scheduledDate ? { scheduled_date: scheduledDate } : {}),
    }),
    onSuccess: (updated) => {
      toast.success(`Status updated to ${newStatus.replace("_", " ")}.`);
      onSaved(updated);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Update failed."),
  });

  const needsRemarks = !!(newStatus && newStatus !== "DELIVERED");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Update Status</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{distribution.farmer_name}</span> — {distribution.program_code}
          </p>

          <div className="grid grid-cols-1 gap-2">
            {STATUSES.map((s) => (
              <button key={s.value}
                onClick={() => setNewStatus(s.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md border-2 text-left transition-all ${
                  newStatus === s.value ? s.style : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {newStatus === "RESCHEDULED" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New scheduled date</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]" />
            </div>
          )}

          {needsRemarks && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks *</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
                placeholder="Explain the status change…"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            <button
              onClick={() => mut.mutate()}
              disabled={!newStatus || mut.isPending || (needsRemarks && !remarks.trim())}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}>
              {mut.isPending ? "Saving…" : "Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
