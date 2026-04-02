import { useState, useEffect, useCallback } from "react";
import {
  getIncidents,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  dismissIncident,
} from "../../../../../services/incidentService";
import type {
  Incident,
  CreateIncidentPayload,
  ResolveIncidentPayload,
  IncidentQueryParams,
} from "../../../../../types/api";

/**
 * Hook for managing incidents — listing, creating, and transitioning status.
 * Provides state for the incidents list along with CRUD actions.
 */
export function useIncidents(initialParams?: IncidentQueryParams) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialParams?.page ?? 1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<IncidentQueryParams>(initialParams ?? {});

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getIncidents({ ...filters, page });
      setIncidents(res.data.incidents || []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError((err as Error).message || "Failed to fetch incidents");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addIncident = async (payload: CreateIncidentPayload) => {
    const response = await createIncident(payload);
    if (response.status === "success") {
      await fetchAll();
      return response.data.incident;
    }
    throw new Error(response.message || "Failed to create incident");
  };

  const doAcknowledge = async (id: string) => {
    const response = await acknowledgeIncident(id);
    if (response.status === "success") {
      await fetchAll();
      return response.data.incident;
    }
    throw new Error(response.message || "Failed to acknowledge incident");
  };

  const doResolve = async (id: string, payload: ResolveIncidentPayload) => {
    const response = await resolveIncident(id, payload);
    if (response.status === "success") {
      await fetchAll();
      return response.data.incident;
    }
    throw new Error(response.message || "Failed to resolve incident");
  };

  const doDismiss = async (id: string, payload: ResolveIncidentPayload) => {
    const response = await dismissIncident(id, payload);
    if (response.status === "success") {
      await fetchAll();
      return response.data.incident;
    }
    throw new Error(response.message || "Failed to dismiss incident");
  };

  return {
    incidents,
    total,
    page,
    totalPages,
    loading,
    error,
    setPage,
    setFilters,
    addIncident,
    acknowledge: doAcknowledge,
    resolve: doResolve,
    dismiss: doDismiss,
    refetch: fetchAll,
  };
}
