/**
 * Event and rental management service.
 *
 * Covers all CRUD operations for events (bookings) and rentals (material assignments).
 * Events represent customer bookings, while rentals track the actual material
 * assignments and their lifecycle.
 */

import { get, post, patch, del, type ApiSuccessResponse } from "../lib/api";
import type {
  Event,
  EventsListResponse,
  CreateEventPayload,
  UpdateEventPayload,
  EventMaterial,
  EventMaterialsListResponse,
  AssignMaterialToEventPayload,
  Rental,
  RentalsListResponse,
  CreateRentalPayload,
  UpdateRentalStatusPayload,
  EventsQueryParams,
  RentalsQueryParams,
} from "../types/api";

// ═══════════════════════════════════════════════════════════════════════════
// Events CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all events for the current organization.
 */
export async function getEvents(
  params?: EventsQueryParams,
): Promise<ApiSuccessResponse<EventsListResponse>> {
  return get<EventsListResponse>(
    "/events",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/**
 * Get a single event by ID.
 */
export async function getEvent(eventId: string): Promise<ApiSuccessResponse<{ event: Event }>> {
  return get<{ event: Event }>(`/events/${eventId}`);
}

/**
 * Create a new event.
 */
export async function createEvent(
  payload: CreateEventPayload,
): Promise<ApiSuccessResponse<{ event: Event }>> {
  return post<{ event: Event }, CreateEventPayload>("/events", payload);
}

/**
 * Update an existing event.
 */
export async function updateEvent(
  eventId: string,
  payload: UpdateEventPayload,
): Promise<ApiSuccessResponse<{ event: Event }>> {
  return patch<{ event: Event }, UpdateEventPayload>(`/events/${eventId}`, payload);
}

/**
 * Delete an event.
 */
export async function deleteEvent(eventId: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/events/${eventId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Materials
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all materials assigned to an event.
 */
export async function getEventMaterials(
  eventId: string,
): Promise<ApiSuccessResponse<EventMaterialsListResponse>> {
  return get<EventMaterialsListResponse>(`/events/${eventId}/materials`);
}

/**
 * Assign a material to an event.
 */
export async function assignMaterialToEvent(
  eventId: string,
  payload: AssignMaterialToEventPayload,
): Promise<ApiSuccessResponse<{ material: EventMaterial }>> {
  return post<{ material: EventMaterial }, AssignMaterialToEventPayload>(
    `/events/${eventId}/materials`,
    payload,
  );
}

/**
 * Remove a material from an event.
 */
export async function removeMaterialFromEvent(
  eventId: string,
  materialId: string,
): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/events/${eventId}/materials/${materialId}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Rentals
// ═══════════════════════════════════════════════════════════════════════════

/**
 * List all rentals for the current organization.
 */
export async function getRentals(
  params?: RentalsQueryParams,
): Promise<ApiSuccessResponse<RentalsListResponse>> {
  return get<RentalsListResponse>(
    "/rentals",
    params as Record<string, string | number | boolean | undefined>,
  );
}

/**
 * Get a single rental by ID.
 */
export async function getRental(
  rentalId: string,
): Promise<ApiSuccessResponse<{ rental: Rental }>> {
  return get<{ rental: Rental }>(`/rentals/${rentalId}`);
}

/**
 * Create a new rental.
 */
export async function createRental(
  payload: CreateRentalPayload,
): Promise<ApiSuccessResponse<{ rental: Rental }>> {
  return post<{ rental: Rental }, CreateRentalPayload>("/rentals", payload);
}

/**
 * Update the status of a rental.
 */
export async function updateRentalStatus(
  rentalId: string,
  payload: UpdateRentalStatusPayload,
): Promise<ApiSuccessResponse<{ rental: Rental }>> {
  return patch<{ rental: Rental }, UpdateRentalStatusPayload>(`/rentals/${rentalId}/status`, payload);
}

/**
 * Delete a rental.
 */
export async function deleteRental(rentalId: string): Promise<ApiSuccessResponse<null>> {
  return del<null>(`/rentals/${rentalId}`);
}
