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
  created_at: string;
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
};
