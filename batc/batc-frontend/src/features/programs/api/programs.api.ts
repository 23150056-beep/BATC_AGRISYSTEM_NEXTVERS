import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export interface ProgramItem {
  id: number;
  inventory_item: number;
  inventory_item_detail: { id: number; name: string; unit: string };
  qty_per_beneficiary: string;
  max_per_farmer: string | null;
}

export interface EligibilityCriterion {
  id?: number;
  field: string;
  operator: string;
  value: string;
  fail_message: string;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  source_agency: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "COMPLETED";
  start_date: string;
  end_date: string;
  target_barangays: string[];
  item_count: number;
  // M-4: eligible_farmer_count is only returned by the detail endpoint to
  // avoid an N+1 query on the list. Use optional to allow both shapes.
  eligible_farmer_count?: number;
  created_at: string;
  items?: ProgramItem[];
  criteria?: EligibilityCriterion[];
}

export interface ProgramWritePayload {
  name: string;
  code: string;
  source_agency?: string;
  start_date: string;
  end_date: string;
  target_barangays: string[];
  items: { inventory_item: number; qty_per_beneficiary: string; max_per_farmer?: string }[];
  criteria: EligibilityCriterion[];
}

export const programsApi = {
  list: (params?: { status?: string; search?: string; eligible_for_me?: string }) =>
    apiClient.get<PaginatedResponse<Program>>("/programs/", { params }).then((r) => r.data),

  retrieve: (id: number) =>
    apiClient.get<Program>(`/programs/${id}/`).then((r) => r.data),

  create: (data: ProgramWritePayload) =>
    apiClient.post<Program>("/programs/", data).then((r) => r.data),

  update: (id: number, data: Partial<ProgramWritePayload>) =>
    apiClient.patch<Program>(`/programs/${id}/`, data).then((r) => r.data),

  activate: (id: number) =>
    apiClient.post<Program>(`/programs/${id}/activate/`).then((r) => r.data),

  suspend: (id: number) =>
    apiClient.post<Program>(`/programs/${id}/suspend/`).then((r) => r.data),

  complete: (id: number) =>
    apiClient.post<Program>(`/programs/${id}/complete/`).then((r) => r.data),

  eligibleFarmers: (id: number) =>
    apiClient.get(`/programs/${id}/eligible-farmers/`).then((r) => r.data),
};
