import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  target_roles: string[];
  published_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export const announcementsApi = {
  list: () =>
    apiClient.get<PaginatedResponse<Announcement>>("/announcements/").then((r) => r.data),

  create: (data: { title: string; body: string; target_roles: string[] }) =>
    apiClient.post<Announcement>("/announcements/", data).then((r) => r.data),

  update: (id: number, data: Partial<{ title: string; body: string; target_roles: string[] }>) =>
    apiClient.patch<Announcement>(`/announcements/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/announcements/${id}/`).then((r) => r.data),
};
