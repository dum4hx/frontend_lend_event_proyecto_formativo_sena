/**
 * Warehouse Operator API service
 *
 * Provides functions to fetch and manage warehouse inventory, locations,
 * stock movements and alerts.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  PaginationMeta,
} from "../types/api";

// Inventory Items
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  minThreshold: number;
  location: string;
  lastUpdated: string;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  pagination: PaginationMeta;
}

export async function getInventoryItems(params?: { page?: number; limit?: number }): Promise<ApiSuccessResponse<InventoryListResponse>> {
  return get<InventoryListResponse>("/warehouse/inventory", params as Record<string, string | number | boolean | undefined>);
}

export async function getInventoryItem(id: string): Promise<ApiSuccessResponse<InventoryItem>> {
  return get<InventoryItem>(`/warehouse/inventory/${id}`);
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<ApiSuccessResponse<InventoryItem>> {
  return patch<InventoryItem, Partial<InventoryItem>>(`/warehouse/inventory/${id}`, data);
}

export async function deleteInventoryItem(id: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/warehouse/inventory/${id}`);
}

// Warehouse Locations
export interface WarehouseLocation {
  id: string;
  code: string;
  section: string;
  shelf: string;
  capacity: number;
  occupied: number;
  status: "available" | "full" | "maintenance";
}

export interface LocationsListResponse {
  locations: WarehouseLocation[];
  pagination: PaginationMeta;
}

export async function getLocations(params?: { page?: number; limit?: number }): Promise<ApiSuccessResponse<LocationsListResponse>> {
  return get<LocationsListResponse>("/warehouse/locations", params as Record<string, string | number | boolean | undefined>);
}

export async function getLocation(id: string): Promise<ApiSuccessResponse<WarehouseLocation>> {
  return get<WarehouseLocation>(`/warehouse/locations/${id}`);
}

export async function createLocation(data: Omit<WarehouseLocation, "id">): Promise<ApiSuccessResponse<WarehouseLocation>> {
  return post<WarehouseLocation, Omit<WarehouseLocation, "id">>("/warehouse/locations", data);
}

export async function updateLocation(id: string, data: Partial<WarehouseLocation>): Promise<ApiSuccessResponse<WarehouseLocation>> {
  return patch<WarehouseLocation, Partial<WarehouseLocation>>(`/warehouse/locations/${id}`, data);
}

export async function deleteLocation(id: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/warehouse/locations/${id}`);
}

// Stock Movements
export interface StockMovement {
  id: string;
  type: "inbound" | "outbound" | "transfer" | "adjustment";
  itemSku: string;
  itemName: string;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  timestamp: string;
  operator: string;
  reason?: string;
}

export interface StockMovementListResponse {
  movements: StockMovement[];
  pagination: PaginationMeta;
}

export async function getStockMovements(params?: { page?: number; limit?: number; type?: string }): Promise<ApiSuccessResponse<StockMovementListResponse>> {
  return get<StockMovementListResponse>("/warehouse/stock-movements", params as Record<string, string | number | boolean | undefined>);
}

export async function recordStockMovement(data: Omit<StockMovement, "id" | "timestamp" | "operator">): Promise<ApiSuccessResponse<StockMovement>> {
  return post<StockMovement, Omit<StockMovement, "id" | "timestamp" | "operator">>("/warehouse/stock-movements", data);
}

// Warehouse Alerts
export interface WarehouseAlert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  location?: string;
  itemSku?: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
}

export interface AlertsListResponse {
  alerts: WarehouseAlert[];
  pagination: PaginationMeta;
}

export async function getAlerts(params?: { page?: number; limit?: number; status?: string }): Promise<ApiSuccessResponse<AlertsListResponse>> {
  return get<AlertsListResponse>("/warehouse/alerts", params as Record<string, string | number | boolean | undefined>);
}

export async function acknowledgeAlert(id: string): Promise<ApiSuccessResponse<WarehouseAlert>> {
  return patch<WarehouseAlert, Record<string, never>>(`/warehouse/alerts/${id}/acknowledge`, {});
}

export async function resolveAlert(id: string): Promise<ApiSuccessResponse<WarehouseAlert>> {
  return patch<WarehouseAlert, Record<string, never>>(`/warehouse/alerts/${id}/resolve`, {});
}

// Warehouse Dashboard
export interface WarehouseDashboardStats {
  totalItems: number;
  lowStockAlerts: number;
  activeLocations: number;
  stockMovementsToday: number;
}

export async function getWarehouseDashboardStats(): Promise<ApiSuccessResponse<WarehouseDashboardStats>> {
  return get<WarehouseDashboardStats>("/warehouse/dashboard/stats");
}
