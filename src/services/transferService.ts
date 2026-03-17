/**
 * Transfer service.
 *
 * Handles the two-stage transfer flow:
 *  1. Transfer Requests  — planning / approval stage.
 *  2. Transfers          — physical shipment stage.
 */

import { get, post, patch, type ApiSuccessResponse } from "../lib/api";
import type {
  TransferRequest,
  Transfer,
  CreateTransferRequestPayload,
  RespondTransferRequestPayload,
  CreateTransferPayload,
  ReceiveTransferPayload,
  TransferRequestsQueryParams,
} from "../types/api";

// ─── Transfer Requests ─────────────────────────────────────────────────────

/** List all transfer requests for the organization. */
export async function getTransferRequests(
  params?: TransferRequestsQueryParams,
): Promise<ApiSuccessResponse<{ requests: TransferRequest[] }>> {
  const query = params?.status ? `?status=${params.status}` : "";
  return get<{ requests: TransferRequest[] }>(`/transfers/requests${query}`);
}

/** Create a new transfer request. */
export async function createTransferRequest(
  payload: CreateTransferRequestPayload,
): Promise<ApiSuccessResponse<TransferRequest>> {
  return post<TransferRequest, CreateTransferRequestPayload>(
    "/transfers/requests",
    payload,
  );
}

/** Approve, reject, or cancel a transfer request. */
export async function respondToTransferRequest(
  requestId: string,
  payload: RespondTransferRequestPayload,
): Promise<ApiSuccessResponse<TransferRequest>> {
  return patch<TransferRequest, RespondTransferRequestPayload>(
    `/transfers/requests/${requestId}/respond`,
    payload,
  );
}

// ─── Transfers (Shipments) ─────────────────────────────────────────────────

/** List all physical transfers for the organization. */
export async function getTransfers(): Promise<
  ApiSuccessResponse<{ transfers: Transfer[] }>
> {
  return get<{ transfers: Transfer[] }>("/transfers");
}

/** Get a specific transfer by ID. */
export async function getTransfer(
  transferId: string,
): Promise<ApiSuccessResponse<{ transfer: Transfer }>> {
  return get<{ transfer: Transfer }>(`/transfers/${transferId}`);
}

/** Initiate a physical transfer (shipment). */
export async function createTransfer(
  payload: CreateTransferPayload,
): Promise<ApiSuccessResponse<Transfer>> {
  return post<Transfer, CreateTransferPayload>("/transfers", payload);
}

/** Mark a transfer as received at the destination. */
export async function receiveTransfer(
  transferId: string,
  payload?: ReceiveTransferPayload,
): Promise<ApiSuccessResponse<Transfer>> {
  return patch<Transfer, ReceiveTransferPayload>(
    `/transfers/${transferId}/receive`,
    payload ?? {},
  );
}
