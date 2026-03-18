import { useState, useCallback, useEffect } from "react";
import { getUsers } from "../../../services/userService";
import { getLoans } from "../../../services/loanService";
import { getInvoicesSummary } from "../../../services/invoiceService";
import { getRequests } from "../../../services/loanService";
import type { LoanRequest, Loan } from "../../../types/api";

export interface DashboardStats {
  totalUsers: number;
  activeLoans: number;
  overdueLoans: number;
  paidInvoicesTotal: number;
  pendingInvoicesTotal: number;
  pendingInvoicesCount: number;
  recentRequests: LoanRequest[];
  recentOverdueLoans: Loan[];
  /** Timestamp captured at fetch time — safe to use in render without triggering impure-function lint rule */
  fetchedAt: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        usersRes,
        activeLoansRes,
        overdueLoansRes,
        invoicesRes,
        pendingRequestsRes,
        overdueLoansListRes,
      ] = await Promise.all([
        getUsers({ page: 1, limit: 1 }),
        getLoans({ status: "active", page: 1, limit: 1 }),
        getLoans({ status: "overdue", page: 1, limit: 1 }),
        getInvoicesSummary(),
        getRequests({ status: "pending", page: 1, limit: 5 }),
        getLoans({ status: "overdue", page: 1, limit: 5 }),
      ]);

      setStats({
        totalUsers: usersRes.data.total,
        activeLoans: activeLoansRes.data.total,
        overdueLoans: overdueLoansRes.data.total,
        paidInvoicesTotal: invoicesRes.data.paid.total,
        pendingInvoicesTotal: invoicesRes.data.pending.total,
        pendingInvoicesCount: invoicesRes.data.pending.count,
        recentRequests: pendingRequestsRes.data.requests ?? [],
        recentOverdueLoans: overdueLoansListRes.data.loans ?? [],
        fetchedAt: Date.now(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
