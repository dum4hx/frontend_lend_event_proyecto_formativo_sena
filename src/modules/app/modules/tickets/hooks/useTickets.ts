/**
 * Hook for managing tickets (solicitudes de usuario).
 *
 * Provides state for the ticket listing, detail view, and all lifecycle
 * actions (create, review, approve, reject, cancel).
 */

import { useState, useEffect, useCallback } from "react";
import {
  getTickets,
  getTicket,
  createTicket,
  reviewTicket,
  approveTicket,
  rejectTicket,
  cancelTicket,
  type TicketsListData,
} from "../../../../../services/ticketService";
import type {
  Ticket,
  TicketListItem,
  TicketStatus,
  TicketType,
  TicketQueryParams,
  CreateTicketPayload,
  ApproveTicketPayload,
  RejectTicketPayload,
  PaginationMeta,
} from "../../../../../types/api";

interface UseTicketsState {
  tickets: TicketListItem[];
  selectedTicket: Ticket | null;
  pagination: PaginationMeta;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  statusFilter: TicketStatus | undefined;
  typeFilter: TicketType | undefined;
  page: number;
}

export function useTickets() {
  const [state, setState] = useState<UseTicketsState>({
    tickets: [],
    selectedTicket: null,
    pagination: { total: 0, page: 1, totalPages: 1 },
    loading: true,
    detailLoading: false,
    error: null,
    statusFilter: undefined,
    typeFilter: undefined,
    page: 1,
  });

  const fetchTickets = useCallback(async (page = 1, status?: TicketStatus, type?: TicketType) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const params: TicketQueryParams = { page, limit: 20 };
      if (status) params.status = status;
      if (type) params.type = type;
      const res = await getTickets(params);
      const data: TicketsListData = res.data ?? ({} as TicketsListData);
      setState((prev) => ({
        ...prev,
        tickets: data.tickets ?? [],
        pagination: {
          total: data.total ?? 0,
          page: data.page ?? 1,
          totalPages: data.totalPages ?? 0,
        },
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message || "Failed to fetch tickets",
        loading: false,
      }));
    }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, detailLoading: true, error: null }));
      const res = await getTicket(id);
      setState((prev) => ({
        ...prev,
        selectedTicket: res.data,
        detailLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message || "Failed to fetch ticket detail",
        detailLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchTickets(state.page, state.statusFilter, state.typeFilter);
  }, [fetchTickets, state.page, state.statusFilter, state.typeFilter]);

  const setStatusFilter = (status: TicketStatus | undefined) => {
    setState((prev) => ({ ...prev, statusFilter: status, page: 1 }));
  };

  const setTypeFilter = (type: TicketType | undefined) => {
    setState((prev) => ({ ...prev, typeFilter: type, page: 1 }));
  };

  const setPage = (page: number) => {
    setState((prev) => ({ ...prev, page }));
  };

  const clearSelectedTicket = () => {
    setState((prev) => ({ ...prev, selectedTicket: null }));
  };

  const handleCreate = async (payload: CreateTicketPayload) => {
    const res = await createTicket(payload);
    await fetchTickets(state.page, state.statusFilter, state.typeFilter);
    return res.data;
  };

  const handleReview = async (id: string) => {
    const res = await reviewTicket(id);
    setState((prev) => ({ ...prev, selectedTicket: res.data }));
    await fetchTickets(state.page, state.statusFilter, state.typeFilter);
    return res.data;
  };

  const handleApprove = async (id: string, payload?: ApproveTicketPayload) => {
    const res = await approveTicket(id, payload);
    setState((prev) => ({ ...prev, selectedTicket: res.data }));
    await fetchTickets(state.page, state.statusFilter, state.typeFilter);
    return res.data;
  };

  const handleReject = async (id: string, payload: RejectTicketPayload) => {
    const res = await rejectTicket(id, payload);
    setState((prev) => ({ ...prev, selectedTicket: res.data }));
    await fetchTickets(state.page, state.statusFilter, state.typeFilter);
    return res.data;
  };

  const handleCancel = async (id: string) => {
    const res = await cancelTicket(id);
    setState((prev) => ({ ...prev, selectedTicket: res.data }));
    await fetchTickets(state.page, state.statusFilter, state.typeFilter);
    return res.data;
  };

  return {
    tickets: state.tickets,
    selectedTicket: state.selectedTicket,
    pagination: state.pagination,
    loading: state.loading,
    detailLoading: state.detailLoading,
    error: state.error,
    statusFilter: state.statusFilter,
    typeFilter: state.typeFilter,
    page: state.page,
    setStatusFilter,
    setTypeFilter,
    setPage,
    fetchDetail,
    clearSelectedTicket,
    createTicket: handleCreate,
    reviewTicket: handleReview,
    approveTicket: handleApprove,
    rejectTicket: handleReject,
    cancelTicket: handleCancel,
    refetch: () => fetchTickets(state.page, state.statusFilter, state.typeFilter),
  };
}
