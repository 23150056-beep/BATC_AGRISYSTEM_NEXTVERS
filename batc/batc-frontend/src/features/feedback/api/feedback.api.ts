import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export type IssueType = "GENERAL" | "DAMAGED" | "EXPIRED" | "WRONG_QUANTITY" | "WRONG_ITEM";

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  GENERAL:        "General Feedback",
  DAMAGED:        "Damaged Item",
  EXPIRED:        "Expired / Spoiled Item",
  WRONG_QUANTITY: "Wrong Quantity",
  WRONG_ITEM:     "Wrong Item Received",
};

export const QUALITY_ISSUE_TYPES: IssueType[] = ["DAMAGED", "EXPIRED", "WRONG_QUANTITY", "WRONG_ITEM"];

export interface Feedback {
  id: number;
  farmer: number;
  farmer_name: string;
  distribution: number | null;
  program_name: string | null;
  issue_type: IssueType;
  is_quality_issue: boolean;
  rating: number;
  comment: string;
  status: "NEW" | "ACKNOWLEDGED" | "RESOLVED";
  created_at: string;
}

export const feedbackApi = {
  list: (params?: { status?: string; issue_type?: string; quality?: string }) =>
    apiClient.get<PaginatedResponse<Feedback>>("/feedback/", { params }).then((r) => r.data),

  create: (data: { distribution?: number; issue_type: IssueType; rating: number; comment: string }) =>
    apiClient.post<Feedback>("/feedback/", data).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.post<Feedback>(`/feedback/${id}/update-status/`, { status }).then((r) => r.data),

  qualityAlertCount: () =>
    apiClient.get<{ count: number }>("/feedback/quality-alert-count/").then((r) => r.data),
};
