import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Megaphone,
  AlertTriangle,
  X,
  MapPin,
  Users,
  Pin,
  Search,
} from "lucide-react";
import { announcementsApi, type Announcement } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import {
  Button,
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import {
  BAUANG_BARANGAYS,
  FARMER_SEGMENTS,
  SEGMENT_LABELS,
  type FarmerSegment,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type ComposerMode = "closed" | "create" | { editing: Announcement };

const TITLE_MAX = 200;
const BODY_MAX = 2000;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admins",
  STAFF: "Staff",
  CLIENT: "Farmers",
};

// =============================================================================
// Page
// =============================================================================

export default function AdminAnnouncementsPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<ComposerMode>("closed");
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"ALL" | "FARMERS" | "STAFF" | "TARGETED">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", "ADMIN"],
    queryFn: () => announcementsApi.list(),
    staleTime: 30_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted.");
      setConfirmDelete(null);
    },
    onError: () => toast.error("Could not delete announcement."),
  });

  const all = data?.results ?? [];

  // ----- Quick stats ---------------------------------------------------------
  const stats = useMemo(() => {
    const total = all.length;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const last7 = all.filter((a) => new Date(a.published_at).getTime() >= sevenDaysAgo).length;
    const toFarmers = all.filter((a) => a.target_roles.includes("CLIENT")).length;
    const targeted = all.filter(
      (a) =>
        a.target_roles.includes("CLIENT") &&
        (a.target_barangay || a.target_segments.length > 0),
    ).length;
    const pinned = all.filter((a) => a.is_pinned).length;
    return { total, last7, toFarmers, targeted, pinned };
  }, [all]);

  // ----- Filter -------------------------------------------------------------
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((a) => {
      // Scope filter
      if (scope === "FARMERS" && !a.target_roles.includes("CLIENT")) return false;
      if (scope === "STAFF" && !a.target_roles.includes("STAFF")) return false;
      if (
        scope === "TARGETED" &&
        (!a.target_roles.includes("CLIENT") ||
          (!a.target_barangay && a.target_segments.length === 0))
      )
        return false;
      // Search
      if (q && !a.title.toLowerCase().includes(q) && !a.body.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [all, search, scope]);

  const composerOpen = mode !== "closed";
  const editing = typeof mode === "object" ? mode.editing : null;

  const scopeCounts = {
    ALL: all.length,
    FARMERS: all.filter((a) => a.target_roles.includes("CLIENT")).length,
    STAFF: all.filter((a) => a.target_roles.includes("STAFF")).length,
    TARGETED: stats.targeted,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Announcements"
        description="Publish notices to specific audiences — and target individual barangays or farmer segments."
        actions={
          <Button
            leftIcon={composerOpen ? <X size={14} /> : <Plus size={14} />}
            onClick={() => setMode(composerOpen ? "closed" : "create")}
          >
            {composerOpen ? "Close composer" : "New announcement"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ---------- Left: list + filters ---------------------------------- */}
        <div className="lg:col-span-2 space-y-3 max-w-3xl">
          {/* Toolbar */}
          <Card className="p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search announcements…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#639922]/40 focus:border-[#639922]"
                />
              </div>
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
                {(
                  [
                    { k: "ALL", label: "All" },
                    { k: "FARMERS", label: "Farmers" },
                    { k: "STAFF", label: "Staff" },
                    { k: "TARGETED", label: "Targeted" },
                  ] as const
                ).map(({ k, label }) => {
                  const active = scope === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setScope(k)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors inline-flex items-center gap-1.5",
                        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
                      )}
                    >
                      {label}
                      <span
                        className={cn(
                          "tabular-nums text-[10px] px-1.5 rounded-full",
                          active ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-gray-200 text-gray-500",
                        )}
                      >
                        {scopeCounts[k]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* List */}
          {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-2.5">
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-5/6" />
                  <Skeleton className="h-2.5 w-1/3" />
                </Card>
              ))}
            </>
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Megaphone size={22} />}
                title={all.length === 0 ? "No announcements yet" : "No matching announcements"}
                description={
                  all.length === 0
                    ? "Create your first announcement to keep farmers and staff informed."
                    : "Try a different search or change the filter."
                }
                action={
                  all.length === 0 ? (
                    <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setMode("create")}>
                      New announcement
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSearch("");
                        setScope("ALL");
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            filtered.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                showAudience
                onEdit={(ann) => setMode({ editing: ann })}
                onDelete={() => setConfirmDelete(a)}
              />
            ))
          )}
        </div>

        {/* ---------- Right: sticky sidebar -------------------------------- */}
        <div>
          <div className="sticky top-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {composerOpen ? (editing ? "Edit announcement" : "Compose") : "Quick stats"}
                </CardTitle>
              </CardHeader>
              {composerOpen ? (
                <Composer
                  key={editing?.id ?? "new"}
                  editing={editing ?? undefined}
                  onClose={() => setMode("closed")}
                />
              ) : (
                <ul className="divide-y divide-gray-100">
                  <StatRow label="Total published" value={stats.total} />
                  <StatRow
                    label="Pinned"
                    value={stats.pinned}
                    icon={<Pin size={11} strokeWidth={2.2} className="text-amber-600" />}
                  />
                  <StatRow label="Reaching farmers" value={stats.toFarmers} />
                  <StatRow
                    label="Subgroup-targeted"
                    value={stats.targeted}
                    icon={<Users size={11} strokeWidth={2.2} className="text-[#3B6D11]" />}
                  />
                  <StatRow label="Last 7 days" value={stats.last7} />
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-5 py-4 flex items-start gap-3 border-b">
              <div className="p-2 rounded-md bg-red-50 text-red-600 shrink-0" aria-hidden="true">
                <AlertTriangle size={16} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Delete this announcement?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  "{confirmDelete.title}" will be removed for everyone who received it. This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-5 py-3 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDelete.id)}
                disabled={deleteMut.isPending}
                className="px-3.5 py-1.5 text-xs font-medium text-white rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----- Stat row -------------------------------------------------------------
function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <li className="px-5 py-3 flex justify-between items-center text-sm">
      <span className="text-gray-600 inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-gray-900 tabular-nums">{value.toLocaleString()}</span>
    </li>
  );
}

// =============================================================================
// Inline composer
// =============================================================================

const ALL_ROLES = ["CLIENT", "STAFF", "ADMIN"] as const;
type Role = (typeof ALL_ROLES)[number];

const AUDIENCE_PRESETS: { value: string; label: string; roles: Role[] }[] = [
  { value: "farmers", label: "All farmers", roles: ["CLIENT"] },
  { value: "staff",   label: "Staff only", roles: ["STAFF"] },
  { value: "admins",  label: "Admins only", roles: ["ADMIN"] },
  { value: "ops",     label: "Staff + Admins", roles: ["STAFF", "ADMIN"] },
  { value: "all",     label: "Everyone", roles: ["CLIENT", "STAFF", "ADMIN"] },
];

function matchPreset(roles: Role[]): string {
  const sorted = [...roles].sort().join(",");
  for (const p of AUDIENCE_PRESETS) {
    if ([...p.roles].sort().join(",") === sorted) return p.value;
  }
  return "custom";
}

function Composer({
  editing,
  onClose,
}: {
  editing?: Announcement;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!editing;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [roles, setRoles] = useState<Role[]>(
    (editing?.target_roles as Role[]) ?? ["CLIENT"],
  );
  const [audiencePreset, setAudiencePreset] = useState<string>(() =>
    matchPreset((editing?.target_roles as Role[]) ?? ["CLIENT"]),
  );
  const [barangay, setBarangay] = useState<string>(editing?.target_barangay ?? "");
  const [segments, setSegments] = useState<FarmerSegment[]>(
    (editing?.target_segments as FarmerSegment[]) ?? [],
  );
  const [pinned, setPinned] = useState<boolean>(editing?.is_pinned ?? false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setBody(editing.body);
      setRoles(editing.target_roles as Role[]);
      setAudiencePreset(matchPreset(editing.target_roles as Role[]));
      setBarangay(editing.target_barangay ?? "");
      setSegments(editing.target_segments as FarmerSegment[]);
      setPinned(editing.is_pinned);
    }
  }, [editing?.id]);

  const reachesFarmers = roles.includes("CLIENT");

  function selectAudience(value: string) {
    setAudiencePreset(value);
    const preset = AUDIENCE_PRESETS.find((p) => p.value === value);
    if (preset) {
      setRoles(preset.roles);
      // Drop subgroup filters when the audience no longer includes farmers.
      if (!preset.roles.includes("CLIENT")) {
        setBarangay("");
        setSegments([]);
      }
    }
  }

  function toggleSegment(s: FarmerSegment) {
    setSegments((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  const payload = {
    title,
    body,
    target_roles: roles,
    target_barangay: reachesFarmers ? barangay : "",
    target_segments: reachesFarmers ? segments : [],
    is_pinned: pinned,
  };

  const createMut = useMutation({
    mutationFn: () => announcementsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement published.");
      onClose();
    },
    onError: (err: any) =>
      toast.error(
        err?.response?.data?.detail ??
          err?.response?.data?.target_roles?.[0] ??
          err?.response?.data?.target_barangay?.[0] ??
          err?.response?.data?.target_segments?.[0] ??
          "Failed to publish.",
      ),
  });

  const editMut = useMutation({
    mutationFn: () => announcementsApi.update(editing!.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated.");
      onClose();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.detail ?? "Failed to update."),
  });

  const isPending = createMut.isPending || editMut.isPending;
  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    roles.length > 0 &&
    !isPending;

  // Live audience summary, in the same shape farmers will see it
  // ("Farmers · Pagdalagan Norte · 4Ps").
  const audienceSummary = useMemo(() => {
    if (roles.length === 0) return "No one will see this.";
    if (
      roles.length === 3 &&
      !barangay &&
      segments.length === 0
    )
      return "Everyone — admins, staff, and farmers.";
    const parts: string[] = [];
    parts.push(roles.map((r) => ROLE_LABELS[r]).join(" + "));
    if (reachesFarmers && barangay) parts.push(barangay);
    if (reachesFarmers && segments.length > 0) {
      parts.push(segments.map((s) => SEGMENT_LABELS[s] ?? s).join(" + "));
    }
    return parts.join(" · ");
  }, [roles, barangay, segments, reachesFarmers]);

  return (
    <CardBody className="space-y-3">
      {/* Title */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500">Title</label>
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
          placeholder="Rice seedling distribution — Brgy. Pagdalagan"
          className="w-full mt-1 border border-gray-300 rounded-md px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#639922]/40 focus:border-[#639922]"
        />
      </div>

      {/* Audience preset */}
      <div>
        <label className="text-xs text-gray-500">Audience</label>
        <select
          value={audiencePreset}
          onChange={(e) => selectAudience(e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded-md px-2.5 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#639922]/40 focus:border-[#639922]"
        >
          {AUDIENCE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          {audiencePreset === "custom" && <option value="custom">Custom selection</option>}
        </select>

        <div className="flex gap-1.5 mt-2">
          {ALL_ROLES.map((r) => {
            const active = roles.includes(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  const next = active ? roles.filter((x) => x !== r) : [...roles, r];
                  setRoles(next);
                  setAudiencePreset(matchPreset(next));
                  if (!next.includes("CLIENT")) {
                    setBarangay("");
                    setSegments([]);
                  }
                }}
                className={cn(
                  "flex-1 text-[11px] font-medium py-1.5 rounded-md border transition-colors",
                  active
                    ? "bg-[#EAF3DE] border-[#3B6D11] text-[#27500A]"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300",
                )}
              >
                {ROLE_LABELS[r]}
              </button>
            );
          })}
        </div>
        <p
          className={cn(
            "text-[10px] mt-1.5",
            roles.length === 0 ? "text-red-500" : "text-gray-400",
          )}
        >
          {roles.length === 0
            ? "Select at least one audience."
            : `Will reach: ${audienceSummary}`}
        </p>
      </div>

      {/* ---------- Farmer-only refinements (progressive disclosure) ---- */}
      {reachesFarmers && (
        <div className="rounded-lg border border-dashed border-[#C8DDA8] bg-[#EAF3DE]/30 p-3 space-y-3">
          <p className="text-[11px] font-semibold text-[#27500A] uppercase tracking-wide inline-flex items-center gap-1.5">
            <Users size={11} strokeWidth={2.2} aria-hidden="true" />
            Farmer filters
          </p>

          {/* Barangay */}
          <div>
            <label className="text-xs text-gray-600 inline-flex items-center gap-1">
              <MapPin size={11} strokeWidth={2.2} aria-hidden="true" />
              Barangay
            </label>
            <select
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded-md px-2.5 py-2 text-xs bg-white outline-none focus:ring-2 focus:ring-[#639922]/40 focus:border-[#639922]"
            >
              <option value="">All barangays</option>
              {BAUANG_BARANGAYS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {barangay && (
              <p className="text-[10px] text-gray-500 mt-1">
                Only farmers in <span className="font-medium">{barangay}</span> will see this.
              </p>
            )}
          </div>

          {/* Segments */}
          <div>
            <label className="text-xs text-gray-600">Segments</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {FARMER_SEGMENTS.map((s) => {
                const active = segments.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSegment(s)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors",
                      active
                        ? "bg-[#3B6D11] border-[#3B6D11] text-white"
                        : "bg-white border-gray-300 text-gray-600 hover:border-[#3B6D11]/50",
                    )}
                  >
                    {SEGMENT_LABELS[s]}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">
              {segments.length === 0
                ? "No segment filter — reaches every farmer in the chosen scope."
                : `Only farmers tagged as ${segments
                    .map((s) => SEGMENT_LABELS[s])
                    .join(" / ")} will see this.`}
            </p>
          </div>
        </div>
      )}

      {/* Body */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500">Body</label>
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
          rows={5}
          maxLength={BODY_MAX}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Pickup window opens Monday at the BATC warehouse…"
          className="w-full mt-1 border border-gray-300 rounded-md px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-[#639922]/40 focus:border-[#639922] resize-none leading-relaxed"
        />
      </div>

      {/* Pin to top */}
      <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="rounded border-gray-300 text-[#3B6D11] focus:ring-[#639922]/40"
        />
        <Pin size={11} strokeWidth={2.2} className="text-amber-600" aria-hidden="true" />
        Pin to top
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={() => (isEdit ? editMut.mutate() : createMut.mutate())}
        >
          {isPending
            ? isEdit
              ? "Saving…"
              : "Publishing…"
            : isEdit
              ? "Save changes"
              : "Publish"}
        </Button>
      </div>
    </CardBody>
  );
}
