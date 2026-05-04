import apiClient from "@/services/api/client";

export interface AdminDashboardData {
  total_farmers: number;
  active_programs: number;
  pending_applications: number;
  distributions_today: number;
  low_stock_items: number;
  total_distributions: number;
  fulfilled_applications: number;
}

export interface StaffDashboardData {
  pending_applications: number;
  distributions_today: number;
  scheduled_today: number;
  delivered_today: number;
}

export const dashboardApi = {
  admin: () => apiClient.get<AdminDashboardData>("/dashboard/admin/").then((r) => r.data),
  staff: () => apiClient.get<StaffDashboardData>("/dashboard/staff/").then((r) => r.data),
};
