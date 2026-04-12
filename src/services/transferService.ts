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
  MaterialTraceabilityEvent,
  CreateTransferRequestPayload,
  RespondTransferRequestPayload,
  UpdateTransferRequestPayload,
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

/** Get a single transfer request by ID. Returns the normalized request and extracted location names. */
export async function getTransferRequest(
  id: string,
): Promise<{ request: TransferRequest; locationNames: Record<string, string> }> {
  const res = await get<unknown>(`/transfers/requests/${id}`);

  type PopulatedRef = { _id?: string; name?: string };
  type RawSingle = {
    _id?: string;
    fromLocationId?: string | PopulatedRef;
    toLocationId?: string | PopulatedRef;
    requestedBy?: string | { _id?: string; name?: unknown };
    status?: TransferRequest["status"];
    items?: TransferRequestItem[];
    notes?: string;
    neededBy?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  const raw = (
    res.data !== null &&
    typeof res.data === "object" &&
    "data" in (res.data as Record<string, unknown>)
      ? (res.data as Record<string, unknown>).data
      : res.data
  ) as RawSingle;

  const fromRef = raw.fromLocationId;
  const toRef = raw.toLocationId;
  const requesterRef = raw.requestedBy;

  const locationNames: Record<string, string> = {};
  const fromId = typeof fromRef === "string" ? fromRef : (fromRef?._id ?? "");
  const toId = typeof toRef === "string" ? toRef : (toRef?._id ?? "");
  if (typeof fromRef === "object" && fromRef?.name) locationNames[fromId] = fromRef.name;
  if (typeof toRef === "object" && toRef?.name) locationNames[toId] = toRef.name;

  const request: TransferRequest = {
    _id: raw._id ?? id,
    fromLocationId: fromId,
    toLocationId: toId,
    requestedBy: typeof requesterRef === "string" ? requesterRef : (requesterRef?._id ?? ""),
    status: raw.status ?? "requested",
    items: raw.items ?? [],
    notes: raw.notes,
    neededBy: raw.neededBy,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
  };

  return { request, locationNames };
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

/** Update items, notes, and/or neededBy of a transfer request. */
export async function updateTransferRequest(
  requestId: string,
  payload: UpdateTransferRequestPayload,
): Promise<ApiSuccessResponse<TransferRequest>> {
  return patch<TransferRequest, UpdateTransferRequestPayload>(
    `/transfers/requests/${requestId}`,
    payload,
  );
}

/** Cancel a transfer request. */
export async function cancelTransferRequest(
  requestId: string,
): Promise<ApiSuccessResponse<TransferRequest>> {
  return patch<TransferRequest, Record<string, never>>(
    `/transfers/requests/${requestId}/cancel`,
    {},
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
    traceabilityEvents?: MaterialTraceabilityEvent[];
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
      traceabilityEvents: r.traceabilityEvents ?? [],
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
