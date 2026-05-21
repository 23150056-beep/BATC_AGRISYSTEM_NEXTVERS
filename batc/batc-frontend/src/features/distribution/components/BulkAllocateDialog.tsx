import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { distributionApi } from "../api/distribution.api";
import { programsApi } from "@/features/programs/api/programs.api";

interface Props {
  onClose: () => void;
}

export function BulkAllocateDialog({ onClose }: Props) {
  const qc = useQueryClient();
  const [programId, setProgramId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  const { data: programs } = useQuery({
    queryKey: ["programs", { status: "APPROVED" }],
    queryFn: () => programsApi.list({ status: "ACTIVE" }),
  });

  const selectedProgram = programs?.results.find((p) => p.id === Number(programId));

  const mut = useMutation({
    mutationFn: () => distributionApi.bulkAllocate({
      program_id: Number(programId),
      ...(scheduledDate ? { scheduled_date: scheduledDate } : {}),
    }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["distributions"] });
      // Bulk reschedules can shift reservation dates — refresh inventory views too.
      qc.invalidateQueries({ queryKey: ["inventory-items"] });
      qc.invalidateQueries({ queryKey: ["inventory-summary"] });
      qc.invalidateQueries({ queryKey: ["inventory-usage"] });
      // M-7: endpoint now returns { updated } (bulk-reschedule), not { created, errors }
      toast.success(`Updated ${result.updated} distribution(s).`);
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Bulk allocate failed."),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Bulk Allocate Distributions</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]">
              <option value="">Select active program…</option>
              {programs?.results.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>

          {selectedProgram && (
            <div className="p-3 bg-[#EAF3DE] rounded-md text-sm">
              <p className="text-gray-700 font-medium">{selectedProgram.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">Existing distributions in SCHEDULED / DELAYED / RESCHEDULED state will have their pickup date updated.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled date (optional)</label>
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
            <button
              onClick={() => mut.mutate()}
              disabled={!programId || mut.isPending}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60"
              style={{ backgroundColor: "#3B6D11" }}>
              {mut.isPending ? "Allocating…" : "Allocate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
