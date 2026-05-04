import { Megaphone } from "lucide-react";
import { type Announcement } from "../api/announcements.api";

interface Props {
  announcement: Announcement;
  /** Show audience role badges — pass true only in the admin management view. */
  showAudience?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (announcement: Announcement) => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN:  "Admin",
  STAFF:  "Staff",
  CLIENT: "Farmers",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:  "bg-purple-100 text-purple-700",
  STAFF:  "bg-blue-100  text-blue-700",
  CLIENT: "bg-[#EAF3DE] text-[#27500A]",
};

export function AnnouncementCard({ announcement, showAudience = false, onDelete, onEdit }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Megaphone size={15} className="text-[#639922] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{announcement.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(announcement.published_at).toLocaleDateString("en-PH", {
                year: "numeric", month: "short", day: "numeric",
              })}{" "}
              · {announcement.created_by_name ?? "System"}
            </p>
          </div>
        </div>

        {/* Audience badges — admin-only view */}
        {showAudience && (
          <div className="flex flex-wrap gap-1 shrink-0">
            {announcement.target_roles.map((r) => (
              <span
                key={r}
                className={`px-1.5 py-0.5 text-[11px] rounded font-medium ${ROLE_COLORS[r] ?? "bg-gray-100 text-gray-600"}`}
              >
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-[22px]">
        {announcement.body}
      </p>

      {(onDelete || onEdit) && (
        <div className="flex justify-end gap-3 pt-1 pl-[22px]">
          {onEdit && (
            <button
              onClick={() => onEdit(announcement)}
              className="text-xs text-[#3B6D11] hover:underline font-medium"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(announcement.id)}
              className="text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
