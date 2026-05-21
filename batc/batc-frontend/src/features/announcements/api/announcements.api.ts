import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";
import type { FarmerSegment } from "@/lib/constants";

export interface Announcement {
  id: number;
  title: string;
  body: string;
  target_roles: string[];
  /** Empty string = all barangays. Only meaningful when target_roles includes "CLIENT". */
  target_barangay: string;
  /** Empty list = no segment filter. Only meaningful when target_roles includes "CLIENT". */
  target_segments: FarmerSegment[];
  is_pinned: boolean;
  published_at: string;
  created_by: number | null;
  created_by_name: string | null;
}

export interface AnnouncementWritePayload {
  title: string;
  body: string;
  target_roles: string[];
  target_barangay?: string;
  target_segments?: FarmerSegment[];
  is_pinned?: boolean;
}

export const announcementsApi = {
  list: () =>
    apiClient.get<PaginatedResponse<Announcement>>("/announcements/").then((r) => r.data),

  create: (data: AnnouncementWritePayload) =>
    apiClient.post<Announcement>("/announcements/", data).then((r) => r.data),

  update: (id: number, data: Partial<AnnouncementWritePayload>) =>
    apiClient.patch<Announcement>(`/announcements/${id}/`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/announcements/${id}/`).then((r) => r.data),
};
