import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";
import { announcementsApi, type Announcement } from "../api/announcements.api";

const ALL_ROLES = ["ADMIN", "STAFF", "CLIENT"] as const;
const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", STAFF: "Staff", CLIENT: "Farmers" };
const ROLE_COLORS: Record<string, { active: string; inactive: string }> = {
  ADMIN:  { active: "bg-purple-100 border-purple-400 text-purple-700",  inactive: "bg-gray-50 border-gray-200 text-gray-400" },
  STAFF:  { active: "bg-blue-100  border-blue-400  text-blue-700",      inactive: "bg-gray-50 border-gray-200 text-gray-400" },
  CLIENT: { active: "bg-[#EAF3DE] border-[#3B6D11] text-[#27500A]",    inactive: "bg-gray-50 border-gray-200 text-gray-400" },
};

interface Props {
  /** Pass an existing announcement to enter edit mode. */
  editing?: Announcement;
  onClose: () => void;
}

export function AnnouncementComposer({ editing, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body,  setBody]  = useState(editing?.body  ?? "");
  // Default: Farmers only — the most common announcement target
  const [roles, setRoles] = useState<string[]>(editing?.target_roles ?? ["CLIENT"]);

  // Sync fields if the editing prop changes
  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setBody(editing.body);
      setRoles(editing.target_roles);
    }
  }, [editing?.id]);

  function toggleRole(r: string) {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  const createMut = useMutation({
    mutationFn: () => announcementsApi.create({ title, body, target_roles: roles }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement published.");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? err?.response?.data?.target_roles?.[0] ?? "Failed to publish."),
  });

  const editMut = useMutation({
    mutationFn: () => announcementsApi.update(editing!.id, { title, body, target_roles: roles }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated.");
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? "Failed to update."),
  });

  const isPending = createMut.isPending || editMut.isPending;
  const canSubmit  = title.trim().length > 0 && body.trim().length > 0 && roles.length > 0 && !isPending;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rice Seed Distribution Schedule"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922]"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Write the announcement content here…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922] resize-none"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience <span className="text-gray-400 font-normal">(who sees this)</span>
            </label>
            <div className="flex gap-2">
              {ALL_ROLES.map((r) => {
                const active  = roles.includes(r);
                const colors  = ROLE_COLORS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      active ? colors.active : colors.inactive
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                );
              })}
            </div>
            {roles.length === 0 && (
              <p className="text-xs text-red-500 mt-1.5">Select at least one audience.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={() => isEdit ? editMut.mutate() : createMut.mutate()}
              disabled={!canSubmit}
              className="px-5 py-2 text-sm text-white rounded-md disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "#3B6D11" }}
            >
              {isPending ? (isEdit ? "Saving…" : "Publishing…") : (isEdit ? "Save Changes" : "Publish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
