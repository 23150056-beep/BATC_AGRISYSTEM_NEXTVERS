import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export interface Application {
  id: number;
  farmer: number;
  farmer_name: string;
  farmer_barangay: string;
  program: number;
  program_name: string;
  program_code: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED" | "FULFILLED";
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  rejection_reason: string;
  notes: string;
}

export const applicationsApi = {
  list: (params?: { status?: string; program?: string; farmer?: string }) =>
    apiClient.get<PaginatedResponse<Application>>("/applications/", { params }).then((r) => r.data),

  mine: () =>
    apiClient.get<Application[]>("/applications/mine/").then((r) => r.data),

  create: (data: { farmer: number; program: number; notes?: string }) =>
    apiClient.post<Application>("/applications/", data).then((r) => r.data),

  approve: (id: number) =>
    apiClient.post<Application>(`/applications/${id}/approve/`).then((r) => r.data),

  reject: (id: number, reason: string) =>
    apiClient.post<Application>(`/applications/${id}/reject/`, { reason }).then((r) => r.data),

  cancel: (id: number) =>
    apiClient.post<Application>(`/applications/${id}/cancel/`).then((r) => r.data),
};
