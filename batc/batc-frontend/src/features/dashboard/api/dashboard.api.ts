import apiClient from "@/services/api/client";

export interface WeeklyTrendPoint {
  week_label: string;
  week_start: string; // ISO yyyy-mm-dd
  count: number;
}

export interface ScheduleEntry {
  id: number;
  title: string;
  barangay: string;
  farmer_name: string;
  status: string;
}

export interface ActivityEntry {
  id: number;
  actor: string;
  action: string;
  target_model: string;
  target_id: number | null;
  notes: string;
  tone: "green" | "amber" | "red" | "blue" | "navy";
  created_at: string; // ISO datetime
}

export interface AdminDashboardData {
  // Scalar KPIs
  total_farmers: number;
  active_programs: number;
  pending_applications: number;
  distributions_today: number;
  low_stock_items: number;
  total_distributions: number;
  fulfilled_applications: number;
  inventory_items: number;
  delivered_this_month: number;

  // Attention strip
  oldest_pending_days: number;
  next_distribution: ScheduleEntry | null;

  // Trends
  weekly_delivered_trend: WeeklyTrendPoint[];
  delivered_mom_pct: number | null;

  // Detail panels
  today_schedule: ScheduleEntry[];
  recent_activity: ActivityEntry[];
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
