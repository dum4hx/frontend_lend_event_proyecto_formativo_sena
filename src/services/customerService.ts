/**
 * Customer service.
 *
 * CRUD operations for organization customers (rental clients).
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomersQueryParams,
  PaginationMeta,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** Fetch a paginated list of customers. */
export async function getCustomers(
  params: CustomersQueryParams = {},
): Promise<ApiSuccessResponse<{ customers: Customer[] } & PaginationMeta>> {
  return get<{ customers: Customer[] } & PaginationMeta>(
    "/customers",
    params as Record<string, string | number | boolean | undefined>,
  );
}

// ─── Single ────────────────────────────────────────────────────────────────

/** Fetch a single customer by ID. */
export async function getCustomer(
  customerId: string,
): Promise<ApiSuccessResponse<{ customer: Customer }>> {
  return get<{ customer: Customer }>(`/customers/${customerId}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new customer. */
export async function createCustomer(
  payload: CreateCustomerPayload,
): Promise<ApiSuccessResponse<{ customer: Customer }>> {
  return post<{ customer: Customer }, CreateCustomerPayload>(
    "/customers",
    payload,
  );
}

// ─── Update ────────────────────────────────────────────────────────────────

/** Update an existing customer. */
export async function updateCustomer(
  customerId: string,
  payload: UpdateCustomerPayload,
): Promise<ApiSuccessResponse<{ customer: Customer }>> {
  return patch<{ customer: Customer }, UpdateCustomerPayload>(
    `/customers/${customerId}`,
    payload,
  );
}

// ─── Blacklist ─────────────────────────────────────────────────────────────

/** Blacklist a customer. */
export async function blacklistCustomer(
  customerId: string,
): Promise<ApiSuccessResponse<null>> {
  return post<null>(`/customers/${customerId}/blacklist`);
}

// ─── Delete ────────────────────────────────────────────────────────────────

/** Soft-delete a customer (sets status to inactive). */
export async function deleteCustomer(
  customerId: string,
): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/customers/${customerId}`);
}
