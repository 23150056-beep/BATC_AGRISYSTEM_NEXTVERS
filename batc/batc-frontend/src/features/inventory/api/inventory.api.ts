import apiClient from "@/services/api/client";
import type { PaginatedResponse } from "@/types";

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  low_stock_threshold: string;
  total_stock: number;
  is_low_stock: boolean;
  batch_count: number;
  /** Units already promised to scheduled / delayed / rescheduled distributions. */
  reserved_qty: number;
  /** total_stock − reserved_qty (clamped at 0). What's actually free to allocate. */
  available_qty: number;
  created_at: string;
}

export interface InventoryItemUsage {
  item_id: number;
  programs: {
    id: number;
    code: string;
    name: string;
    status: string;
    qty_per_beneficiary: string;
    active_applications: number;
  }[];
  upcoming: {
    distribution_id: number;
    scheduled_date: string | null;
    status: string;
    farmer_name: string;
    barangay: string;
    program_code: string;
    program_name: string;
    lot_number: string;
    qty_reserved: number;
  }[];
  upcoming_count: number;
  reserved_total: number;
}

export interface StockBatch {
  id: number;
  item: number;
  item_name: string;
  lot_number: string;
  received_date: string;
  expiry_date: string | null;
  initial_qty: string;
  current_qty: string;
  created_at: string;
}

export interface InventorySummary {
  total_skus: number;
  low_stock_count: number;
  categories_count: number;
  active_batch_count: number;
  total_units: number;
  /** Total units soft-reserved across the system for live distributions. */
  reserved_units: number;
  /** total_units − reserved_units (clamped at 0). */
  available_units: number;
}

export interface StockMovement {
  id: number;
  quantity: string;
  movement_type: string;
  reference_note: string;
  created_by_name: string;
  created_at: string;
}

export const inventoryApi = {
  listItems: (params?: { search?: string; category?: string }) =>
    apiClient.get<PaginatedResponse<InventoryItem>>("/inventory/items/", { params }).then((r) => r.data),

  createItem: (data: { name: string; category: string; unit: string; low_stock_threshold: string }) =>
    apiClient.post<InventoryItem>("/inventory/items/", data).then((r) => r.data),

  updateItem: (id: number, data: Partial<InventoryItem>) =>
    apiClient.patch<InventoryItem>(`/inventory/items/${id}/`, data).then((r) => r.data),

  getBatches: (itemId: number) =>
    apiClient.get<StockBatch[]>(`/inventory/items/${itemId}/batches/`).then((r) => r.data),

  getMovements: (itemId: number) =>
    apiClient.get<PaginatedResponse<StockMovement>>(`/inventory/items/${itemId}/movements/`).then((r) => r.data),

  receiveStock: (itemId: number, data: { lot_number: string; received_date: string; expiry_date?: string; quantity: string; reference_note?: string }) =>
    apiClient.post<StockBatch>(`/inventory/items/${itemId}/receive/`, data).then((r) => r.data),

  adjustBatch: (batchId: number, data: { quantity: string; reference_note: string }) =>
    apiClient.post<StockBatch>(`/inventory/batches/${batchId}/adjust/`, data).then((r) => r.data),

  lowStock: () =>
    apiClient.get<InventoryItem[]>("/inventory/items/low-stock/").then((r) => r.data),

  summary: () =>
    apiClient.get<InventorySummary>("/inventory/items/summary/").then((r) => r.data),

  /** Cross-page links: which programs use this item and which distributions reserve it. */
  usage: (itemId: number) =>
    apiClient.get<InventoryItemUsage>(`/inventory/items/${itemId}/usage/`).then((r) => r.data),
};
