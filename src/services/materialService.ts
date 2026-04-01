/**
 * Material & package service.
 *
 * Covers material categories, types (catalog items), individual
 * instances, and packages (bundles).
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  MaterialCategory,
  CreateMaterialCategoryPayload,
  UpdateMaterialCategoryPayload,
  MaterialType,
  CreateMaterialTypePayload,
  UpdateMaterialTypePayload,
  MaterialAttribute,
  MaterialTypeAttribute,
  CreateMaterialAttributePayload,
  UpdateMaterialAttributePayload,
  MaterialInstance,
  CreateMaterialInstancePayload,
  UpdateMaterialInstanceStatusPayload,
  MaterialTypesQueryParams,
  MaterialInstancesQueryParams,
  Package,
  CreatePackagePayload,
  PackageMaterialEntry,
  PaginationMeta,
  CatalogOverviewQueryParams,
  CatalogOverviewResponse,
} from "../types/api";

interface MaterialInstanceApiModel {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  pricePerDay?: number;
}

interface MaterialInstanceApiLocation {
  _id?: string;
  id?: string;
  name?: string;
}

interface MaterialInstanceApiPayload {
  _id: string;
  serialNumber?: string;
  barcode?: string;
  status: MaterialInstance["status"];
  model?: MaterialInstanceApiModel | string;
  modelId?: MaterialInstanceApiModel | string;
  location?: MaterialInstanceApiLocation | string;
  locationId?: MaterialInstanceApiLocation | string;
  organizationId?: string;
  attributes?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface GroupedMaterialInstancesApiPayload {
  location: MaterialInstanceApiLocation;
  instances: MaterialInstanceApiPayload[];
}

interface MaterialInstancesApiResponse extends PaginationMeta {
  instances?: MaterialInstanceApiPayload[];
  byLocation?: GroupedMaterialInstancesApiPayload[];
  currentUserLocations?: GroupedMaterialInstancesApiPayload[];
  otherLocations?: GroupedMaterialInstancesApiPayload[];
}

interface GroupedMaterialInstances {
  location: MaterialInstance["locationId"];
  instances: MaterialInstance[];
}

interface MaterialInstancesResponse extends PaginationMeta {
  instances?: MaterialInstance[];
  byLocation?: GroupedMaterialInstances[];
  currentUserLocations?: GroupedMaterialInstances[];
  otherLocations?: GroupedMaterialInstances[];
}

function normalizeMaterialModel(
  model: MaterialInstanceApiPayload["model"] | MaterialInstanceApiPayload["modelId"],
): MaterialInstance["model"] {
  if (typeof model === "string") {
    return {
      _id: model,
      name: "Unknown material type",
      pricePerDay: 0,
    };
  }

  return {
    _id: model?._id ?? model?.id ?? "",
    name: model?.name ?? "Unknown material type",
    description: model?.description,
    pricePerDay: typeof model?.pricePerDay === "number" ? model.pricePerDay : 0,
  };
}

function normalizeMaterialLocation(
  location:
    | MaterialInstanceApiPayload["location"]
    | MaterialInstanceApiPayload["locationId"]
    | MaterialInstanceApiLocation
    | undefined,
): MaterialInstance["locationId"] {
  if (typeof location === "string") {
    return {
      _id: location,
      id: location,
      name: "Unknown location",
    };
  }

  return {
    _id: location?._id ?? location?.id ?? "",
    id: location?.id ?? location?._id ?? "",
    name: location?.name ?? "Unknown location",
  };
}

function normalizeMaterialInstance(
  instance: MaterialInstanceApiPayload,
  fallbackLocation?: MaterialInstanceApiLocation,
): MaterialInstance {
  return {
    _id: instance._id,
    serialNumber: instance.serialNumber ?? "",
    barcode: instance.barcode,
    status: instance.status,
    model: normalizeMaterialModel(instance.modelId ?? instance.model),
    locationId: normalizeMaterialLocation(
      instance.locationId ?? instance.location ?? fallbackLocation,
    ),
    organizationId: instance.organizationId ?? "",
    attributes: (Array.isArray(instance.attributes)
      ? instance.attributes
      : []) as MaterialTypeAttribute[],
    createdAt: instance.createdAt ?? "",
    updatedAt: instance.updatedAt ?? "",
    __v: instance.__v ?? 0,
  };
}

function normalizeGroupedMaterialInstances(
  groups?: GroupedMaterialInstancesApiPayload[],
): GroupedMaterialInstances[] | undefined {
  if (!groups) {
    return undefined;
  }

  return groups.map((group) => ({
    location: normalizeMaterialLocation(group.location),
    instances: (group.instances ?? []).map((instance) =>
      normalizeMaterialInstance(instance, group.location),
    ),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════════════════════

/** List all material categories. */
export async function getMaterialCategories(): Promise<
  ApiSuccessResponse<{ categories: MaterialCategory[] }>
> {
  return get<{ categories: MaterialCategory[] }>("/materials/categories");
}

/** Create a new material category. */
export async function createMaterialCategory(
  payload: CreateMaterialCategoryPayload,
): Promise<ApiSuccessResponse<{ category: MaterialCategory }>> {
  return post<{ category: MaterialCategory }, CreateMaterialCategoryPayload>(
    "/materials/categories",
    payload,
  );
}

/** Update a material category. */
export async function updateMaterialCategory(
  categoryId: string,
  payload: UpdateMaterialCategoryPayload,
): Promise<ApiSuccessResponse<{ category: MaterialCategory }>> {
  return patch<{ category: MaterialCategory }, UpdateMaterialCategoryPayload>(
    `/materials/categories/${categoryId}`,
    payload,
  );
}

/** Delete a material category. */
export async function deleteMaterialCategory(
  categoryId: string,
): Promise<ApiSuccessResponse<{ message: string }>> {
  return del<{ message: string }>(`/materials/categories/${categoryId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Material Types (catalog items)
// ═══════════════════════════════════════════════════════════════════════════

/** List material types with optional filtering. */
export async function getMaterialTypes(
  params: MaterialTypesQueryParams = {},
): Promise<ApiSuccessResponse<{ materialTypes: MaterialType[] }>> {
  return get<{ materialTypes: MaterialType[] }>(
    "/materials/types",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/** Create a new material type. Validates against org catalog limit. */
export async function createMaterialType(
  payload: CreateMaterialTypePayload,
): Promise<ApiSuccessResponse<{ materialType: MaterialType }>> {
  return post<{ materialType: MaterialType }, CreateMaterialTypePayload>(
    "/materials/types",
    payload,
  );
}

/** Update a material type. */
export async function updateMaterialType(
  typeId: string,
  payload: UpdateMaterialTypePayload,
): Promise<ApiSuccessResponse<{ materialType: MaterialType }>> {
  return patch<{ materialType: MaterialType }, UpdateMaterialTypePayload>(
    `/materials/types/${typeId}`,
    payload,
  );
}

/** Delete a material type. */
export async function deleteMaterialType(
  typeId: string,
): Promise<ApiSuccessResponse<{ message: string }>> {
  return del<{ message: string }>(`/materials/types/${typeId}`);
}

/** Delete a material instance. */
export async function deleteMaterialInstance(
  instanceId: string,
): Promise<ApiSuccessResponse<{ message: string }>> {
  return del<{ message: string }>(`/materials/instances/${instanceId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Material Instances
// ═══════════════════════════════════════════════════════════════════════════

/** List material instances with optional filtering. */
export async function getMaterialInstances(
  params: MaterialInstancesQueryParams = {},
): Promise<ApiSuccessResponse<MaterialInstancesResponse>> {
  const response = await get<MaterialInstancesApiResponse>(
    "/materials/instances",
    params as Record<string, string | number | boolean | undefined>,
  );

  return {
    ...response,
    data: {
      ...response.data,
      instances: response.data.instances?.map((instance) => normalizeMaterialInstance(instance)),
      byLocation: normalizeGroupedMaterialInstances(response.data.byLocation),
      currentUserLocations: normalizeGroupedMaterialInstances(response.data.currentUserLocations),
      otherLocations: normalizeGroupedMaterialInstances(response.data.otherLocations),
    },
  };
}

/** Create a new material instance. */
export async function createMaterialInstance(
  payload: CreateMaterialInstancePayload,
): Promise<ApiSuccessResponse<{ instance: MaterialInstance }>> {
  return post<{ instance: MaterialInstance }, CreateMaterialInstancePayload>(
    "/materials/instances",
    payload,
  );
}

/** Update a material instance's status. */
export async function updateMaterialInstanceStatus(
  instanceId: string,
  payload: UpdateMaterialInstanceStatusPayload,
): Promise<ApiSuccessResponse<{ instance: MaterialInstance }>> {
  return patch<{ instance: MaterialInstance }, UpdateMaterialInstanceStatusPayload>(
    `/materials/instances/${instanceId}/status`,
    payload,
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Packages
// ═══════════════════════════════════════════════════════════════════════════

/** List all packages in the organization. */
export async function getPackages(
  params: { page?: number; limit?: number } = {},
): Promise<ApiSuccessResponse<{ packages: Package[] } & PaginationMeta>> {
  return get<{ packages: Package[] } & PaginationMeta>(
    "/packages",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/** Get a specific package by ID. */
export async function getPackage(
  packageId: string,
): Promise<ApiSuccessResponse<{ package: Package }>> {
  return get<{ package: Package }>(`/packages/${packageId}`);
}

/** Create a new package (bundle of materials). */
export async function createPackage(
  payload: CreatePackagePayload & Partial<{ items: PackageMaterialEntry[] }>,
): Promise<ApiSuccessResponse<{ package: Package }>> {
  // Backend expects `items` in the request body (docs show `items: [{ materialTypeId, quantity }]`).
  // Accept callers using `materialTypes` (existing shape) or `items`, and normalize here.
  const items: PackageMaterialEntry[] = payload.items ?? payload.items ?? [];

  const body: {
    name: string;
    description?: string;
    items: PackageMaterialEntry[];
    pricePerDay?: number;
  } = {
    name: payload.name,
    description: payload.description,
    items,
    pricePerDay: payload.pricePerDay,
  };

  return post<{ package: Package }, typeof body>("/packages", body);
}

// ═══════════════════════════════════════════════════════════════════════════
// Material Attributes
// ═══════════════════════════════════════════════════════════════════════════

/** List all attribute definitions for the organization. */
export async function getMaterialAttributes(params?: {
  categoryId?: string;
}): Promise<ApiSuccessResponse<{ attributes: MaterialAttribute[] }>> {
  return get<{ attributes: MaterialAttribute[] }>(
    "/materials/attributes",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/** Get a specific attribute definition. */
export async function getMaterialAttribute(
  attributeId: string,
): Promise<ApiSuccessResponse<{ attribute: MaterialAttribute }>> {
  return get<{ attribute: MaterialAttribute }>(`/materials/attributes/${attributeId}`);
}

/** Create a new attribute definition. */
export async function createMaterialAttribute(
  payload: CreateMaterialAttributePayload,
): Promise<ApiSuccessResponse<{ attribute: MaterialAttribute }>> {
  return post<{ attribute: MaterialAttribute }, CreateMaterialAttributePayload>(
    "/materials/attributes",
    payload,
  );
}

/** Update an attribute definition. */
export async function updateMaterialAttribute(
  attributeId: string,
  payload: UpdateMaterialAttributePayload,
): Promise<ApiSuccessResponse<{ attribute: MaterialAttribute }>> {
  return patch<{ attribute: MaterialAttribute }, UpdateMaterialAttributePayload>(
    `/materials/attributes/${attributeId}`,
    payload,
  );
}

/** Delete an attribute definition. */
export async function deleteMaterialAttribute(
  attributeId: string,
): Promise<ApiSuccessResponse<{ message: string }>> {
  return del<{ message: string }>(`/materials/attributes/${attributeId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Package availability
// ═══════════════════════════════════════════════════════════════════════════

/** Check package availability for a date range. */
export async function getPackageAvailability(
  packageId: string,
  startDate: string,
  endDate: string,
): Promise<
  ApiSuccessResponse<{
    available: boolean;
    unavailableItems: Array<{
      materialTypeId: string;
      name: string;
      available: number;
      required: number;
    }>;
  }>
> {
  return get<{
    available: boolean;
    unavailableItems: Array<{
      materialTypeId: string;
      name: string;
      available: number;
      required: number;
    }>;
  }>(`/packages/${packageId}/availability`, { startDate, endDate });
}

/** Audit endpoint: returns material types with orphaned attribute values. */
export async function getOrphanedAttributeValues(): Promise<
  ApiSuccessResponse<{
    orphanedCount: number;
    orphanedMaterials: Array<{
      materialTypeId: string;
      materialTypeName: string;
      attributeName: string;
      currentValue: string;
      allowedValues: string[];
      message: string;
    }>;
  }>
> {
  return get<{
    orphanedCount: number;
    orphanedMaterials: Array<{
      materialTypeId: string;
      materialTypeName: string;
      attributeName: string;
      currentValue: string;
      allowedValues: string[];
      message: string;
    }>;
  }>("/materials/audit/orphaned-attribute-values");
}

// ═══════════════════════════════════════════════════════════════════════════
// Catalog Overview
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch the aggregated catalog overview with metrics and alerts. */
export async function getCatalogOverview(
  params: CatalogOverviewQueryParams = {},
): Promise<ApiSuccessResponse<CatalogOverviewResponse>> {
  return get<CatalogOverviewResponse>(
    "/materials/catalog/overview",
    params as Record<string, string | number | boolean | undefined>,
  );
}
