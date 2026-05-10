import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Megaphone } from "lucide-react";
import { announcementsApi, type Announcement } from "@/features/announcements/api/announcements.api";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { AnnouncementComposer } from "@/features/announcements/components/AnnouncementComposer";
import { Button, PageHeader, Card, EmptyState, Skeleton } from "@/components/ui";

export default function AdminAnnouncementsPage() {
  const qc = useQueryClient();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["announcements", "ADMIN"],
    queryFn:  () => announcementsApi.list(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted.");
    },
    onError: () => toast.error("Could not delete announcement."),
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Publish notices to specific audiences."
        actions={
          <Button leftIcon={<Plus size={14} />} onClick={() => setComposing(true)}>
            New Announcement
          </Button>
        }
      />

      <div className="space-y-3 max-w-2xl">
        {isLoading ? (
          <>
            <Card className="p-4 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </Card>
            <Card className="p-4 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-2/5" />
            </Card>
          </>
        ) : !data?.results.length ? (
          <Card>
            <EmptyState
              icon={<Megaphone size={22} />}
              title="No announcements yet"
              description="Create your first announcement to keep farmers and staff informed."
              action={
                <Button size="sm" leftIcon={<Plus size={13} />} onClick={() => setComposing(true)}>
                  New Announcement
                </Button>
              }
            />
          </Card>
        ) : (
          data.results.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              showAudience
              onEdit={(ann) => setEditing(ann)}
              onDelete={(id) => deleteMut.mutate(id)}
            />
          ))
        )}
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
