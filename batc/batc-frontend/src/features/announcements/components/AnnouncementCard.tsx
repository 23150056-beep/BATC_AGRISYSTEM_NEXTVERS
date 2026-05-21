import { useMemo, useState } from "react";
import { Users, MapPin, ChevronDown, Pin } from "lucide-react";
import { type Announcement } from "../api/announcements.api";
import { Card, Badge, type BadgeProps } from "@/components/ui";
import { SEGMENT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  announcement: Announcement;
  /** Show audience badges & actions — pass true only in admin views. */
  showAudience?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (announcement: Announcement) => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admins",
  STAFF: "Staff",
  CLIENT: "Farmers",
};

type Tone = NonNullable<BadgeProps["tone"]>;

/**
 * Derive a top-of-card category badge from the audience shape. Mirrors the
 * design system's badge palette (DISTRIBUTION green, REGISTRATION blue,
 * PROGRAM navy, NOTICE amber).
 */
function categorize(a: Announcement): { tag: string; tone: Tone } {
  const set = new Set(a.target_roles);
  // Farmer-targeted with subgroup filters → "PROGRAM" navy
  if (set.has("CLIENT") && (a.target_barangay || a.target_segments.length > 0)) {
    return { tag: "PROGRAM", tone: "navy" };
  }
  if (set.size === 3) return { tag: "ANNOUNCEMENT", tone: "navy" };
  if (set.has("CLIENT") && set.size === 1) return { tag: "FARMERS", tone: "green" };
  if (set.has("STAFF") && set.size === 1) return { tag: "STAFF", tone: "blue" };
  if (set.has("ADMIN") && set.size === 1) return { tag: "ADMIN", tone: "navy" };
  if (set.has("CLIENT") && set.has("STAFF")) return { tag: "OPERATIONS", tone: "amber" };
  return { tag: "NOTICE", tone: "amber" };
}

/**
 * Builds the audience line for the meta row, e.g.
 *  - "Everyone"
 *  - "Farmers"
 *  - "Farmers · Pagdalagan Norte"
 *  - "Farmers · 4Ps"
 *  - "Farmers · Pagdalagan Norte · 4Ps + PWD"
 */
function audienceLabel(a: Announcement): string {
  if (a.target_roles.length === 0) return "No audience";
  if (a.target_roles.length === 3 && !a.target_barangay && a.target_segments.length === 0) {
    return "Everyone";
  }
  const parts: string[] = [];
  parts.push(a.target_roles.map((r) => ROLE_LABELS[r] ?? r).join(" + "));
  if (a.target_barangay) parts.push(a.target_barangay);
  if (a.target_segments.length > 0) {
    parts.push(a.target_segments.map((s) => SEGMENT_LABELS[s] ?? s).join(" + "));
  }
  return parts.join(" · ");
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function AnnouncementCard({ announcement, showAudience = false, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { tag, tone } = useMemo(() => categorize(announcement), [announcement]);

  const isLong = announcement.body.length > 280 || announcement.body.split("\n").length > 4;
  const body = isLong && !expanded
    ? announcement.body.slice(0, 280).trimEnd() + "…"
    : announcement.body;

  const hasSubgroup =
    !!announcement.target_barangay || announcement.target_segments.length > 0;

  return (
    <Card
      className={cn(
        "p-4 transition-shadow",
        announcement.is_pinned && "ring-1 ring-amber-200 bg-gradient-to-r from-amber-50/40 to-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="flex items-center flex-wrap gap-1.5">
            <Badge tone={tone}>{tag}</Badge>
            {announcement.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                <Pin size={10} strokeWidth={2.2} aria-hidden="true" />
                Pinned
              </span>
            )}
            {/* Subgroup chips — small, compact, near the category badge */}
            {announcement.target_barangay && (
              <Badge tone="neutral" size="sm" className="font-normal">
                <MapPin size={9} strokeWidth={2.2} aria-hidden="true" />
                {announcement.target_barangay}
              </Badge>
            )}
            {announcement.target_segments.map((s) => (
              <Badge key={s} tone="green" size="sm" className="font-normal">
                {SEGMENT_LABELS[s] ?? s}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <p className="font-semibold text-gray-900 mt-2 leading-snug">
            {announcement.title}
          </p>

          {/* Body */}
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line leading-relaxed">
            {body}
          </p>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-[#3B6D11] hover:text-[#27500A] font-medium inline-flex items-center gap-0.5"
            >
              {expanded ? "Show less" : "Read more"}
              <ChevronDown
                size={12}
                className={cn("transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5 text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Users size={10} strokeWidth={2} aria-hidden="true" />
              {audienceLabel(announcement)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{announcement.created_by_name ?? "System"}</span>
            <span aria-hidden="true">·</span>
            <span>{timeAgo(announcement.published_at)}</span>
            {showAudience && hasSubgroup && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 inline-flex items-center gap-0.5">
                  <Users size={9} strokeWidth={2.2} aria-hidden="true" />
                  Targeted
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right action stack — admin view only */}
        {showAudience && (onEdit || onDelete) && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(announcement)}
                className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(announcement.id)}
                className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
