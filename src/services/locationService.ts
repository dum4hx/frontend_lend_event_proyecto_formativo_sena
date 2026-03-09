import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";

export interface Address {
  country: string;
  state?: string;
  city: string;
  street: string;
  propertyNumber: string;
  additionalInfo?: string;
}

export interface LocationModel {
  _id: string;
  name: string;
  organizationId: string;
  address: Address;
  createdAt: string;
  updatedAt: string;
}

export interface LocationsListResponse {
  items: LocationModel[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getLocations(params?: { page?: number; limit?: number; search?: string; city?: string }): Promise<ApiSuccessResponse<LocationsListResponse>> {
  return get<LocationsListResponse>("/locations", params as Record<string, string | number | boolean | undefined>);
}

export async function getLocation(id: string): Promise<ApiSuccessResponse<LocationModel>> {
  return get<LocationModel>(`/locations/${id}`);
}

export async function createLocation(data: Omit<LocationModel, "_id" | "organizationId" | "createdAt" | "updatedAt">): Promise<ApiSuccessResponse<LocationModel>> {
  return post<LocationModel, typeof data>("/locations", data);
}

export async function updateLocation(id: string, data: Partial<LocationModel>): Promise<ApiSuccessResponse<LocationModel>> {
  return patch<LocationModel, Partial<LocationModel>>(`/locations/${id}`, data);
}

export async function deleteLocation(id: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/locations/${id}`);
}

export default {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
};
