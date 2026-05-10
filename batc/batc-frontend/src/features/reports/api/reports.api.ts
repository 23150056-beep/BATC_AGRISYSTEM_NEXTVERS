import apiClient from "@/services/api/client";

export interface ReportSummary {
  window: { date_from: string | null; date_to: string | null };
  totals: {
    farmers: number;
    active_programs: number;
    distributions: number;
    delivered: number;
    scheduled: number;
    delayed: number;
    applications: number;
    approval_rate: number | null;
    feedback_count: number;
    avg_rating: number | null;
    quality_issues: number;
    inventory_items: number;
    low_stock_items: number;
  };
  distribution_status_breakdown: { status: string; count: number }[];
  application_status_breakdown:  { status: string; count: number }[];
  livelihood_breakdown:          { livelihood_type: string; count: number }[];
  barangay_breakdown:            { barangay: string; count: number }[];
  delivered_trend:               { day: string | null; count: number }[];
}

export const reportsApi = {
  summary: (params?: { date_from?: string; date_to?: string }) =>
    apiClient.get<ReportSummary>("/reports/summary/", { params }).then((r) => r.data),

  /** Returns the row count that would be exported with the given filters. */
  count: (endpoint: string, params: Record<string, string>) =>
    apiClient
      .get<{ count: number }>(endpoint, { params: { ...params, count: "true" } })
      .then((r) => r.data.count),

  /** Downloads a CSV blob with the given filters; triggers browser save. */
  download: async (endpoint: string, filename: string, params: Record<string, string>) => {
    const res = await apiClient.get(endpoint, {
      params,
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
