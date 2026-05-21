import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Megaphone, Users, Sparkles } from "lucide-react";
import { announcementsApi, type Announcement } from "../api/announcements.api";
import { cn } from "@/lib/utils";

const ALL_ROLES = ["CLIENT", "STAFF", "ADMIN"] as const;
type Role = (typeof ALL_ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admins",
  STAFF: "Staff",
  CLIENT: "Farmers",
};

const ROLE_HELP: Record<Role, string> = {
  CLIENT: "All registered farmer accounts",
  STAFF: "Staff dashboard inbox",
  ADMIN: "Other administrators only",
};

const ROLE_STYLES: Record<Role, { active: string; bullet: string }> = {
  CLIENT: {
    active: "bg-[#EAF3DE] border-[#3B6D11] text-[#27500A]",
    bullet: "bg-[#639922]",
  },
  STAFF: {
    active: "bg-blue-50 border-blue-500 text-blue-800",
    bullet: "bg-blue-500",
  },
  ADMIN: {
    active: "bg-purple-50 border-purple-500 text-purple-800",
    bullet: "bg-purple-500",
  },
};

const TITLE_MAX = 200;
const BODY_MAX = 2000;

interface Props {
  /** Pass an existing announcement to enter edit mode. */
  editing?: Announcement;
  onClose: () => void;
}

export function AnnouncementComposer({ editing, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  // Default: Farmers only — the most common announcement target
  const [roles, setRoles] = useState<Role[]>(
    (editing?.target_roles as Role[]) ?? ["CLIENT"],
  );

  // Sync fields if the editing prop changes
  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setBody(editing.body);
      setRoles(editing.target_roles as Role[]);
    }
  }, [editing?.id]);

  function toggleRole(r: Role) {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
  }

  const createMut = useMutation({
    mutationFn: () => announcementsApi.create({ title, body, target_roles: roles }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement published.");
      onClose();
    },
    onError: (err: any) =>
      toast.error(
        err?.response?.data?.detail ??
          err?.response?.data?.target_roles?.[0] ??
          "Failed to publish.",
      ),
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
  const canSubmit =
    title.trim().length > 0 && body.trim().length > 0 && roles.length > 0 && !isPending;

  const audienceSummary = useMemo(() => {
    if (roles.length === 0) return "No one will see this yet.";
    if (roles.length === 3) return "Everyone — admins, staff, and farmers.";
    return roles.map((r) => ROLE_LABELS[r]).join(" + ");
  }, [roles]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with brand accent */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-[#EAF3DE]/60 to-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="p-2 rounded-md bg-[#3B6D11] text-white shrink-0"
              aria-hidden="true"
            >
              <Megaphone size={14} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm">
                {isEdit ? "Edit announcement" : "New announcement"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isEdit
                  ? "Update what subscribers already saw."
                  : "Publish a notice to your chosen audience."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  title.length > TITLE_MAX ? "text-red-500" : "text-gray-400",
                )}
              >
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rice Seed Distribution Schedule"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922] focus:border-[#639922]"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  body.length > BODY_MAX ? "text-red-500" : "text-gray-400",
                )}
              >
                {body.length}/{BODY_MAX}
              </span>
            </div>
            <textarea
              value={body}
              maxLength={BODY_MAX}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write the announcement content. Line breaks are preserved."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#639922] focus:border-[#639922] resize-none leading-relaxed"
            />
            <p className="text-[11px] text-gray-400 mt-1 inline-flex items-center gap-1">
              <Sparkles size={10} strokeWidth={2.2} aria-hidden="true" />
              Keep it clear and actionable. Line breaks render as paragraphs.
            </p>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5 inline-flex items-center gap-1.5">
              <Users size={12} strokeWidth={2.2} aria-hidden="true" />
              Audience <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_ROLES.map((r) => {
                const active = roles.includes(r);
                const style = ROLE_STYLES[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={cn(
                      "relative text-left px-3 py-2.5 text-xs font-medium rounded-lg border-2 transition-all",
                      active
                        ? style.active + " shadow-sm"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          active ? style.bullet : "bg-gray-300",
                        )}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-[12px]">{ROLE_LABELS[r]}</span>
                    </div>
                    <p className="text-[10px] mt-0.5 leading-tight opacity-80">
                      {ROLE_HELP[r]}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Live audience summary */}
            <div
              className={cn(
                "mt-2.5 flex items-center gap-2 px-3 py-2 rounded-md text-[11px]",
                roles.length === 0
                  ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                  : "bg-gray-50 text-gray-600",
              )}
            >
              <Users size={11} strokeWidth={2.2} aria-hidden="true" />
              <span>
                <span className="font-semibold">Will reach:</span> {audienceSummary}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between gap-2">
          <p className="text-[11px] text-gray-400">
            {isEdit ? "Saved announcements update everywhere." : "Posts publish immediately."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={() => (isEdit ? editMut.mutate() : createMut.mutate())}
              disabled={!canSubmit}
              className="px-4 py-1.5 text-xs font-medium text-white rounded-md disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: "#3B6D11" }}
            >
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Publishing…"
                : isEdit
                  ? "Save changes"
                  : "Publish announcement"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
