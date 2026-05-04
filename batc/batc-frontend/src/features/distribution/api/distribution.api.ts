import apiClient from "@/services/api/client";

export interface DistributionItem {
  id: number;
  batch: number;
  item_name: string;
  lot_number: string;
  unit: string;
  quantity_planned: string;
  quantity_released: string;
}

export interface Distribution {
  id: number;
  application: number;
  program: number;
  program_name: string;
  program_code: string;
  farmer: number;
  farmer_name: string;
  farmer_barangay: string;
  status: "SCHEDULED" | "DELIVERED" | "DELAYED" | "RESCHEDULED" | "OUT_OF_STOCK" | "UNAVAILABLE";
  scheduled_date: string | null;
  delivered_at: string | null;
  remarks: string;
  updated_by: number | null;
  updated_by_name: string | null;
  items: DistributionItem[];
  created_at: string;
}

export const distributionApi = {
  list: (params?: { status?: string; program?: string; scheduled_date?: string }) =>
    apiClient.get<{ results: Distribution[] }>("/distributions/", { params }).then((r) => r.data),

  mine: () =>
    apiClient.get<Distribution[]>("/distributions/mine/").then((r) => r.data),

  updateStatus: (id: number, data: { new_status: string; remarks: string; scheduled_date?: string }) =>
    apiClient.post<Distribution>(`/distributions/${id}/update-status/`, data).then((r) => r.data),

  // M-7: endpoint was renamed bulk-allocate → bulk-reschedule and the response
  // shape changed from { created, errors } to { updated } (Finding #4 fix in backend).
  bulkAllocate: (data: { program_id: number; scheduled_date?: string }) =>
    apiClient.post<{ updated: number }>(
      "/distributions/bulk-reschedule/", data
    ).then((r) => r.data),

  confirmReceipt: (id: number) =>
    apiClient.post<Distribution>(`/distributions/${id}/confirm-receipt/`).then((r) => r.data),
};
