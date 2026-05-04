import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export type UserRole = "ADMIN" | "STAFF" | "CLIENT";

export interface UserItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_archived: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface UserWritePayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  password?: string;
}

export const usersApi = {
  list: (params?: { role?: string; search?: string; page?: number; available_for_link?: string }) =>
    apiClient.get<PaginatedResponse<UserItem>>("/users/", { params }).then((r) => r.data),

  retrieve: (id: number) =>
    apiClient.get<UserItem>(`/users/${id}/`).then((r) => r.data),

  create: (payload: UserWritePayload) =>
    apiClient.post<UserItem>("/users/", payload).then((r) => r.data),

  update: (id: number, payload: Partial<UserWritePayload>) =>
    apiClient.patch<UserItem>(`/users/${id}/`, payload).then((r) => r.data),

  archive: (id: number) =>
    apiClient.patch<UserItem>(`/users/${id}/archive/`).then((r) => r.data),

  unarchive: (id: number) =>
    apiClient.patch<UserItem>(`/users/${id}/unarchive/`).then((r) => r.data),

  resetPassword: (id: number) =>
    apiClient.post<{ temp_password: string }>(`/users/${id}/reset-password/`).then((r) => r.data),
};
