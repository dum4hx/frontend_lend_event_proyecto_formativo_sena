import { useState, useEffect, useCallback } from "react";
import {
  getInvoices,
  getInvoicesSummary,
  recordPayment,
  voidInvoice,
} from "../../../services/invoiceService";
import type {
  Invoice,
  InvoiceSummary,
  RecordPaymentPayload,
  InvoicesQueryParams,
} from "../../../types/api";

/**
 * Hook for managing invoices and payment operations.
 * Provides state for invoices, summary stats, and CRUD actions with loading/error handling.
 */
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async (params: InvoicesQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const [invoicesRes, summaryRes] = await Promise.all([
        getInvoices(params),
        getInvoicesSummary(),
      ]);

      setInvoices(invoicesRes.data.invoices || []);
      setSummary(summaryRes.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch invoices";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const recordPaymentForInvoice = async (
    invoiceId: string,
    payload: RecordPaymentPayload,
  ): Promise<Invoice> => {
    try {
      setActionLoading(true);
      const response = await recordPayment(invoiceId, payload);
      if (response.status === "success") {
        // Refresh both lists to update the invoice state
        await fetchAll();
        return response.data.invoice;
      }
      throw new Error(response.message || "Failed to record payment");
    } finally {
      setActionLoading(false);
    }
  };

  const voidInvoiceAction = async (invoiceId: string, reason: string): Promise<void> => {
    try {
      setActionLoading(true);
      const response = await voidInvoice(invoiceId, reason);
      if (response.status === "success") {
        // Refresh to update the invoice status
        await fetchAll();
        return;
      }
      throw new Error(response.message || "Failed to void invoice");
    } finally {
      setActionLoading(false);
    }
  };

  return {
    invoices,
    summary,
    loading,
    error,
    actionLoading,
    recordPaymentForInvoice,
    voidInvoiceAction,
    refetch: fetchAll,
  };
}
