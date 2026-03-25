import { useState, useEffect, useCallback } from "react";
import {
  getInspections,
  getPendingLoans,
  createInspection,
} from "../../../../../services/inspectionService";
import type { Inspection, PendingLoan, CreateInspectionPayload } from "../../../../../types/api";

/**
 * Hook for managing inspections and pending loans.
 * Provides state for both completed and pending inspections along with CRUD actions.
 */
export function useInspections() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [inspectionsRes, pendingRes] = await Promise.all([getInspections(), getPendingLoans()]);

      setInspections(inspectionsRes.data.inspections || []);
      setPendingLoans(pendingRes.data.pendingLoans || []);
    } catch (err) {
      setError((err as Error).message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const recordInspection = async (payload: CreateInspectionPayload) => {
    const response = await createInspection(payload);
    if (response.status === "success") {
      // Refresh both lists to move the loan to history
      await fetchAll();
      return response.data.inspection;
    }
    throw new Error(response.message || "Failed to save inspection");
  };

  return {
    inspections,
    pendingLoans,
    loading,
    error,
    recordInspection,
    refetch: fetchAll,
  };
}
