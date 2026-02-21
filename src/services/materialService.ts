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
  MaterialInstance,
  CreateMaterialInstancePayload,
  UpdateMaterialInstanceStatusPayload,
  MaterialTypesQueryParams,
  MaterialInstancesQueryParams,
  Package,
  CreatePackagePayload,
  PaginationMeta,
} from "../types/api";

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

// ═══════════════════════════════════════════════════════════════════════════
// Material Instances
// ═══════════════════════════════════════════════════════════════════════════

/** List material instances with optional filtering. */
export async function getMaterialInstances(
  params: MaterialInstancesQueryParams = {},
): Promise<ApiSuccessResponse<{ instances: MaterialInstance[] }>> {
  return get<{ instances: MaterialInstance[] }>(
    "/materials/instances",
    params as Record<string, string | number | boolean | undefined>,
  );
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
  return patch<
    { instance: MaterialInstance },
    UpdateMaterialInstanceStatusPayload
  >(`/materials/instances/${instanceId}/status`, payload);
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
  payload: CreatePackagePayload,
): Promise<ApiSuccessResponse<{ package: Package }>> {
  return post<{ package: Package }, CreatePackagePayload>("/packages", payload);
}
