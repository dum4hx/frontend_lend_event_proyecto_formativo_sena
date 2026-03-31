/**
 * TanStack Query hooks for Transfer Requests & Transfers.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransferRequests,
  createTransferRequest,
  respondToTransferRequest,
  getTransfers,
  createTransfer,
  receiveTransfer,
} from "../../services/transferService";
import type {
  TransferRequestsQueryParams,
  CreateTransferRequestPayload,
  RespondTransferRequestPayload,
  CreateTransferPayload,
  ReceiveTransferPayload,
} from "../../types/api";

export const transferKeys = {
  requests: {
    all: ["transferRequests"] as const,
    lists: () => [...transferKeys.requests.all, "list"] as const,
    list: (params?: TransferRequestsQueryParams) =>
      [...transferKeys.requests.lists(), params ?? {}] as const,
  },
  shipments: {
    all: ["transfers"] as const,
    lists: () => [...transferKeys.shipments.all, "list"] as const,
  },
};

export function useTransferRequests(params?: TransferRequestsQueryParams) {
  return useQuery({
    queryKey: transferKeys.requests.list(params),
    queryFn: () => getTransferRequests(params),
    select: (res) => res.data.requests,
  });
}

export function useCreateTransferRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferRequestPayload) => createTransferRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.requests.all });
    },
  });
}

export function useRespondTransferRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RespondTransferRequestPayload }) =>
      respondToTransferRequest(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.requests.all });
    },
  });
}

export function useTransfers() {
  return useQuery({
    queryKey: transferKeys.shipments.lists(),
    queryFn: () => getTransfers(),
    select: (res) => res.data.transfers,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => createTransfer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.shipments.all });
      qc.invalidateQueries({ queryKey: transferKeys.requests.all });
    },
  });
}

export function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReceiveTransferPayload }) =>
      receiveTransfer(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.shipments.all });
    },
  });
}
