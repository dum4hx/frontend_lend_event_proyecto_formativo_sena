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
  TransferRequestItem,
} from "../types/api";

// ─── Transfer Requests ─────────────────────────────────────────────────────

/** List all transfer requests for the organization. */
export async function getTransferRequests(
  params?: TransferRequestsQueryParams,
): Promise<ApiSuccessResponse<{ requests: TransferRequest[] }>> {
  const queryParts: string[] = [];
  if (params?.status) queryParts.push(`status=${params.status}`);
  if (params?.fulfilled !== undefined) queryParts.push(`fulfilled=${params.fulfilled}`);

  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const res = await get<unknown>(`/transfers/requests${query}`);

  // If API already returns { requests: [...] } keep as-is
  if (
    res &&
    typeof res.data === "object" &&
    res.data !== null &&
    "requests" in (res.data as Record<string, unknown>) &&
    Array.isArray((res.data as Record<string, unknown>).requests)
  ) {
    return res as ApiSuccessResponse<{ requests: TransferRequest[] }>;
  }

  // Extract raw array from possible shapes
  let rawArray: unknown[] = [];
  if (Array.isArray(res.data)) {
    rawArray = res.data as unknown[];
  } else if (
    res &&
    typeof res.data === "object" &&
    res.data !== null &&
    "requests" in (res.data as Record<string, unknown>) &&
    Array.isArray((res.data as Record<string, unknown>).requests)
  ) {
    rawArray = (res.data as Record<string, unknown>).requests as unknown[];
  } else {
    rawArray = [];
  }

  type RawRequest = {
    _id?: string;
    fromLocationId?: string | { _id?: string; name?: string };
    toLocationId?: string | { _id?: string; name?: string };
    requestedBy?: string | { _id?: string; name?: unknown };
    status?: TransferRequest["status"];
    items?: TransferRequestItem[];
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  const normalized: TransferRequest[] = rawArray.map((it) => {
    const r = it as RawRequest;
    const from = r.fromLocationId;
    const to = r.toLocationId;
    const requester = r.requestedBy;
    return {
      _id: r._id ?? "",
      fromLocationId: typeof from === "string" ? from : (from?._id ?? ""),
      toLocationId: typeof to === "string" ? to : (to?._id ?? ""),
      requestedBy: typeof requester === "string" ? requester : (requester?._id ?? ""),
      status: r.status ?? "requested",
      items: r.items ?? [],
      notes: r.notes,
      createdAt: r.createdAt ?? new Date().toISOString(),
      updatedAt: r.updatedAt,
    };
  });

  return {
    ...res,
    data: { requests: normalized },
  } as ApiSuccessResponse<{ requests: TransferRequest[] }>;
}

/** Create a new transfer request. */
export async function createTransferRequest(
  payload: CreateTransferRequestPayload,
): Promise<ApiSuccessResponse<TransferRequest>> {
  return post<TransferRequest, CreateTransferRequestPayload>("/transfers/requests", payload);
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
export async function getTransfers(): Promise<ApiSuccessResponse<{ transfers: Transfer[] }>> {
  const res = await get<unknown>("/transfers");

  type RawTransfer = {
    _id?: string;
    requestId?: string;
    fromLocationId?: string | { _id?: string; name?: string };
    toLocationId?: string | { _id?: string; name?: string };
    items?: Transfer["items"];
    senderNotes?: string;
    receiverNotes?: string;
    status?: Transfer["status"];
    createdAt?: string;
    updatedAt?: string;
  };

  let rawArray: unknown[] = [];
  if (Array.isArray(res.data)) {
    rawArray = res.data as unknown[];
  } else if (
    res &&
    typeof res.data === "object" &&
    res.data !== null &&
    "transfers" in (res.data as Record<string, unknown>) &&
    Array.isArray((res.data as Record<string, unknown>).transfers)
  ) {
    rawArray = (res.data as Record<string, unknown>).transfers as unknown[];
  }

  const normalized: Transfer[] = rawArray.map((it) => {
    const r = it as RawTransfer;
    const from = r.fromLocationId;
    const to = r.toLocationId;
    return {
      _id: r._id ?? "",
      requestId: r.requestId,
      fromLocationId: typeof from === "string" ? from : (from?._id ?? ""),
      toLocationId: typeof to === "string" ? to : (to?._id ?? ""),
      items: r.items ?? [],
      senderNotes: r.senderNotes,
      receiverNotes: r.receiverNotes,
      status: r.status ?? "in_transit",
      createdAt: r.createdAt ?? new Date().toISOString(),
      updatedAt: r.updatedAt,
    };
  });

  return {
    ...res,
    data: { transfers: normalized },
  } as ApiSuccessResponse<{ transfers: Transfer[] }>;
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
  return patch<Transfer, ReceiveTransferPayload>(`/transfers/${transferId}/receive`, payload ?? {});
}
