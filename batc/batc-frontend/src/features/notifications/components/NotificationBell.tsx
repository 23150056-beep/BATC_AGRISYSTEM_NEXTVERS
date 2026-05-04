import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { notificationsApi, type Notification } from "../api/notifications.api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Props {
  /** Override icon color when bell sits on a dark background. */
  variant?: "light" | "dark";
}

const TYPE_ACCENT: Record<string, string> = {
  APPLICATION_SUBMITTED:  "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  APPLICATION_APPROVED:   "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  APPLICATION_REJECTED:   "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  DISTRIBUTION_SCHEDULED: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  DISTRIBUTION_DELIVERED: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  DISTRIBUTION_DELAYED:   "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  QUALITY_ISSUE_REPORTED: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export function NotificationBell({ variant = "light" }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s — same cadence as the existing quality badge.
  // Pause when tab is hidden so a stale tab doesn't accumulate ~2,800 requests
  // overnight (Finding #26).
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn:  notificationsApi.unreadCount,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
  const unread = unreadData?.count ?? 0;

  const { data: listData, refetch } = useQuery({
    queryKey: ["notifications-list"],
    queryFn:  notificationsApi.list,
    enabled:  open,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleClick(n: Notification) {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) navigate(n.link);
    setOpen(false);
  }

  const iconColor = variant === "dark" ? "text-[#8aa0bb] hover:text-white" : "text-gray-500 hover:text-gray-800";
  const items = listData?.results ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) refetch(); }}
        className={cn("relative p-2 rounded-md transition-colors", iconColor)}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-[var(--color-brand-600)] hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCheck size={11} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Inbox size={28} className="opacity-40" />
                <p className="text-sm">You're all caught up.</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0",
                    !n.is_read && "bg-[var(--color-brand-100)]/40"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", n.is_read ? "bg-transparent" : "bg-[var(--color-brand-600)]")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm truncate", n.is_read ? "text-gray-700" : "text-gray-900 font-semibold")}>{n.title}</p>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0", TYPE_ACCENT[n.type] ?? "bg-gray-100 text-gray-600")}>
                          {n.type.split("_")[0]}
                        </span>
                      </div>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
