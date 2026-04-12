/**
 * Ticket service.
 *
 * Manages the full lifecycle of tickets (solicitudes de usuario): creation,
 * retrieval, and status transitions (review, approve, reject, cancel).
 * All methods are organization-scoped and require authentication.
 */

import { get, post, patch, type ApiSuccessResponse } from "../lib/api";
import type {
  Ticket,
  TicketListItem,
  TicketQueryParams,
  CreateTicketPayload,
  ApproveTicketPayload,
  RejectTicketPayload,
  UpdateTicketPayload,
  TicketCapableUsersData,
  PaginationMeta,
} from "../types/api";

// ─── List ──────────────────────────────────────────────────────────────────

/** Flat pagination shape returned by the tickets endpoint. */
export interface TicketsListData extends PaginationMeta {
  tickets: TicketListItem[];
}

/** List tickets with optional filters and pagination. */
export async function getTickets(
  params?: TicketQueryParams,
): Promise<ApiSuccessResponse<TicketsListData>> {
  return get<TicketsListData>(
    "/tickets",
    params as Record<string, string | number | boolean | undefined>,
  );
}

// ─── Single ────────────────────────────────────────────────────────────────

/** Fetch a single ticket by ID. */
export async function getTicket(id: string): Promise<ApiSuccessResponse<Ticket>> {
  return get<Ticket>(`/tickets/${id}`);
}

// ─── Create ────────────────────────────────────────────────────────────────

/** Create a new ticket. */
export async function createTicket(
  payload: CreateTicketPayload,
): Promise<ApiSuccessResponse<Ticket>> {
  return post<Ticket, CreateTicketPayload>("/tickets", payload);
}

// ─── Status Transitions ───────────────────────────────────────────────────

/** Move a ticket to in_review status. */
export async function reviewTicket(id: string): Promise<ApiSuccessResponse<Ticket>> {
  return patch<Ticket>(`/tickets/${id}/review`);
}

/** Approve a ticket with an optional resolution note. */
export async function approveTicket(
  id: string,
  payload?: ApproveTicketPayload,
): Promise<ApiSuccessResponse<Ticket>> {
  return patch<Ticket, ApproveTicketPayload | undefined>(`/tickets/${id}/approve`, payload);
}

/** Reject a ticket with a required resolution note. */
export async function rejectTicket(
  id: string,
  payload: RejectTicketPayload,
): Promise<ApiSuccessResponse<Ticket>> {
  return patch<Ticket, RejectTicketPayload>(`/tickets/${id}/reject`, payload);
}

/** Cancel a ticket (only the creator may cancel). */
export async function cancelTicket(id: string): Promise<ApiSuccessResponse<Ticket>> {
  return patch<Ticket>(`/tickets/${id}/cancel`);
}

// ─── Capable Users ────────────────────────────────────────────────────────

/**
 * Returns the list of active users in the ticket's location who hold the
 * domain-specific permission needed to fulfil the request.
 * Endpoint: GET /tickets/:id/capable-users
 */
export async function getCapableUsers(
  id: string,
): Promise<ApiSuccessResponse<TicketCapableUsersData>> {
  return get<TicketCapableUsersData>(`/tickets/${id}/capable-users`);
}

// ─── General Update ───────────────────────────────────────────────────────

/**
 * Updates mutable fields on an existing ticket (e.g. assigneeId).
 * Requires backend PATCH /tickets/:id endpoint.
 */
export async function updateTicket(
  id: string,
  payload: UpdateTicketPayload,
): Promise<ApiSuccessResponse<Ticket>> {
  return patch<Ticket, UpdateTicketPayload>(`/tickets/${id}`, payload);
}
