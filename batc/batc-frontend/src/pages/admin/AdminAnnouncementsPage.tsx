import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { announcementsApi, type Announcement } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { AnnouncementComposer } from "@/features/announcements/components/AnnouncementComposer";

export default function AdminAnnouncementsPage() {
  const qc = useQueryClient();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  // Admin sees ALL announcements regardless of target_roles.
  // Keyed as ["announcements", "ADMIN"] so it's scoped; invalidating the
  // base key ["announcements"] clears all role sub-keys at once.
  const { data, isLoading } = useQuery({
    queryKey: ["announcements", "ADMIN"],
    queryFn:  () => announcementsApi.list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id),
    onSuccess: () => {
      // Invalidate base key → clears ADMIN, STAFF, and CLIENT caches
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Deleted.");
    },
    onError: () => toast.error("Could not delete announcement."),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500">Publish notices to specific audiences.</p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: "#3B6D11" }}
        >
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {!isLoading && data?.results.length === 0 && (
        <p className="text-sm text-gray-400 italic">No announcements yet.</p>
      )}

      <div className="space-y-3 max-w-2xl">
        {data?.results.map((a) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            showAudience        // admin sees audience badges on every card
            onEdit={(ann) => setEditing(ann)}
            onDelete={(id) => deleteMut.mutate(id)}
          />
        ))}
      </div>

      {composing && (
        <AnnouncementComposer onClose={() => setComposing(false)} />
      )}
      {editing && (
        <AnnouncementComposer editing={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
