import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export type NotificationType =
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  | "DISTRIBUTION_SCHEDULED"
  | "DISTRIBUTION_DELIVERED"
  | "DISTRIBUTION_DELAYED"
  | "QUALITY_ISSUE_REPORTED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: () =>
    apiClient.get<PaginatedResponse<Notification>>("/notifications/").then((r) => r.data),

  unreadCount: () =>
    apiClient.get<{ count: number }>("/notifications/unread-count/").then((r) => r.data),

  markRead: (id: number) =>
    apiClient.post<Notification>(`/notifications/${id}/mark-read/`).then((r) => r.data),

  markAllRead: () =>
    apiClient.post<{ detail: string }>("/notifications/mark-all-read/").then((r) => r.data),
};
