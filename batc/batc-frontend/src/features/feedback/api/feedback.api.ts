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

export interface FeedbackReply {
  id: number;
  feedback: number;
  author: number | null;
  author_name: string;
  author_role: "ADMIN" | "STAFF" | "CLIENT" | null;
  message: string;
  created_at: string;
}

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
  /** Chronological staff/admin replies. */
  replies?: FeedbackReply[];
  reply_count?: number;
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

  /**
   * Post a staff/admin reply on a feedback row. Returns the FULL updated
   * feedback (with replies embedded) so the caller can swap state in place.
   * Server-side this also notifies the farmer + auto-acknowledges NEW items.
   */
  reply: (id: number, message: string) =>
    apiClient.post<Feedback>(`/feedback/${id}/reply/`, { message }).then((r) => r.data),
};
