import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Download,
  Users,
  DollarSign,
  FileText,
  Package,
  RefreshCw,
  TrendingUp,
  ClipboardList,
  Boxes,
  Send,
  ShoppingCart,
  Table2,
  Hammer,
  ArrowLeftRight,
} from "lucide-react";
import { StatCard } from "../../components";
import { PageHeader } from "../../../../components/ui";
import { getCustomers } from "../../../../services/customerService";
import { getRequests } from "../../../../services/loanService";
import { getUsers } from "../../../../services/userService";
import { getLocations } from "../../../../services/warehouseOperatorService";
import { commercialAdvisorService } from "../../../../services/commercialAdvisorService";
import {
  useLoansReport,
  useInventoryReport,
  useFinancialReport,
  useDamagesReport,
  useTransfersReport,
} from "../../../../hooks/queries";
import { ApiError } from "../../../../lib/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { usePermissions } from "../../../../contexts/usePermissions";
import Unauthorized from "../../../../pages/Unauthorized";
import { exportTableToPDF, exportTableToXLSX } from "../../../../utils/tableExport";
import { PAGE_SIZE, fmtId, getReferenceId, exportToCSV } from "./helpers";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsTable } from "./ReportsTable";
import type { ReportsQueryParams } from "../../../../types/api";
import type { StatCardProps } from "../../../../components/ui/StatCard";
import type {
  ReportModule,
  DateRange,
  ModuleFilters,
  ReportRow,
  Customer,
  LoanRequest,
  WarehouseLocation,
  Order,
} from "./types";

// ─── Constants ─────────────────────────────────────────────────────────────

const API_TABS = new Set<ReportModule>(["loans", "financial", "inventory", "damages", "transfers"]);

// ─── Helpers ───────────────────────────────────────────────────────────────

function getBreakdownCount(
  breakdown: Array<{ _id: string; count: number }> | undefined,
  status: string,
): number {
  return breakdown?.find((s) => s._id === status)?.count ?? 0;
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Reports() {
  const { t, formatDate, formatCurrency, language } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();

  // ─── Module config (translated) ─────────────────────────────────────────

  const moduleConfig = useMemo(
    () =>
      ({
        customers: {
          label: t("reports.module.customers"),
          icon: <Users size={18} />,
          description: t("reports.module.customers.desc"),
        },
        requests: {
          label: t("reports.module.requests"),
          icon: <Send size={18} />,
          description: t("reports.module.requests.desc"),
        },
        loans: {
          label: t("reports.module.loans"),
          icon: <TrendingUp size={18} />,
          description: t("reports.module.loans.desc"),
        },
        financial: {
          label: t("reports.module.financial"),
          icon: <DollarSign size={18} />,
          description: t("reports.module.financial.desc"),
        },
        inventory: {
          label: t("reports.module.inventory"),
          icon: <Package size={18} />,
          description: t("reports.module.inventory.desc"),
        },
        team: {
          label: t("reports.module.team"),
          icon: <Users size={18} />,
          description: t("reports.module.team.desc"),
        },
        locations: {
          label: t("reports.module.locations"),
          icon: <Boxes size={18} />,
          description: t("reports.module.locations.desc"),
        },
        orders: {
          label: t("reports.module.orders"),
          icon: <ShoppingCart size={18} />,
          description: t("reports.module.orders.desc"),
        },
        damages: {
          label: t("reports.module.damages"),
          icon: <Hammer size={18} />,
          description: t("reports.module.damages.desc"),
        },
        transfers: {
          label: t("reports.module.transfers"),
          icon: <ArrowLeftRight size={18} />,
          description: t("reports.module.transfers.desc"),
        },
      }) as Record<ReportModule, { label: string; icon: React.ReactNode; description: string }>,
    [t],
  );

  // ─── State ──────────────────────────────────────────────────────────────

  const [activeModule, setActiveModule] = useState<ReportModule>("customers");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [filters, setFilters] = useState<ModuleFilters>({
    customers: { status: "" },
    requests: { status: "" },
    loans: { status: "", overdue: false },
    financial: { status: "", type: "" },
    inventory: { type: "", status: "" },
    team: { status: "" },
    locations: { status: "" },
    orders: { status: "" },
    damages: { status: "" },
    transfers: { status: "" },
  });

  // Client-only tab data
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; email: string; role: string; status: string }>
  >([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // ─── API-backed report hooks ────────────────────────────────────────────

  const baseParams = useMemo<ReportsQueryParams>(
    () => ({
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [dateRange, page],
  );

  const loansQuery = useLoansReport(
    { ...baseParams, status: filters.loans.status || undefined },
    { enabled: activeModule === "loans" },
  );

  const financialQuery = useFinancialReport(
    { ...baseParams, status: filters.financial.status || undefined },
    { enabled: activeModule === "financial" },
  );

  const inventoryQuery = useInventoryReport(baseParams, {
    enabled: activeModule === "inventory",
  });

  const damagesQuery = useDamagesReport(
    { ...baseParams, status: filters.damages.status || undefined },
    { enabled: activeModule === "damages" },
  );

  const transfersQuery = useTransfersReport(
    { ...baseParams, status: filters.transfers.status || undefined },
    { enabled: activeModule === "transfers" },
  );

  // ─── Client-only tab fetch ──────────────────────────────────────────────

  const fetchClientData = useCallback(async () => {
    if (API_TABS.has(activeModule)) return;
    setClientLoading(true);
    setClientError(null);
    try {
      switch (activeModule) {
        case "customers": {
          const res = await getCustomers({
            limit: 100,
            status: filters.customers.status || undefined,
          });
          setCustomers(res.data.customers ?? []);
          break;
        }
        case "requests": {
          const res = await getRequests({
            limit: 100,
            status: filters.requests.status || undefined,
          });
          setRequests(res.data.requests ?? []);
          break;
        }
        case "team": {
          const res = await getUsers({ limit: 100 });
          const rawUsers = (res.data.users ?? []) as unknown as Array<{
            _id?: string;
            id?: string;
            email?: string;
            roleName?: string;
            status?: string;
            name?: { firstName: string; firstSurname: string };
            profile?: { firstName?: string; lastName?: string; firstSurname?: string };
          }>;
          setTeamMembers(
            rawUsers.map((u) => {
              const p = u.profile ?? {};
              const first = p.firstName ?? u.name?.firstName ?? "";
              const last = p.lastName ?? p.firstSurname ?? u.name?.firstSurname ?? "";
              return {
                id: u._id ?? "",
                name: `${first} ${last}`.trim() || (u.email ?? ""),
                email: u.email ?? "",
                role: u.roleName ?? "—",
                status: u.status ?? "—",
              };
            }),
          );
          break;
        }
        case "locations": {
          const res = await getLocations({ limit: 100 });
          setLocations(res.data.items ?? []);
          break;
        }
        case "orders": {
          const res = await commercialAdvisorService.getOrders();
          setOrders(res.data ?? []);
          break;
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setClientError(err.message);
      } else {
        setClientError(t("reports.loadError"));
      }
    } finally {
      setClientLoading(false);
    }
  }, [activeModule, filters, t]);

  useEffect(() => {
    if (!API_TABS.has(activeModule)) {
      void fetchClientData();
    }
  }, [activeModule, fetchClientData]);

  // ─── Derived loading / error ────────────────────────────────────────────

  const activeQuery = (() => {
    switch (activeModule) {
      case "loans":
        return loansQuery;
      case "financial":
        return financialQuery;
      case "inventory":
        return inventoryQuery;
      case "damages":
        return damagesQuery;
      case "transfers":
        return transfersQuery;
      default:
        return null;
    }
  })();

  const loading = API_TABS.has(activeModule) ? (activeQuery?.isLoading ?? false) : clientLoading;

  const error = API_TABS.has(activeModule)
    ? activeQuery?.isError
      ? activeQuery.error instanceof Error
        ? activeQuery.error.message
        : t("reports.loadError")
      : null
    : clientError;

  // ─── Build rows ────────────────────────────────────────────────────────

  const { headers, rows } = useMemo<{ headers: string[]; rows: ReportRow[] }>(() => {
    const fmtDate = (iso: string | undefined): string => {
      if (!iso) return "—";
      return formatDate(iso);
    };

    const fmtCurrency = (val: number): string => formatCurrency(val, "COP");

    const matchesDate = (iso: string | undefined) => {
      if (!iso) return true;
      if (dateRange.from && iso < dateRange.from) return false;
      if (dateRange.to && iso > dateRange.to + "T23:59:59") return false;
      return true;
    };

    switch (activeModule) {
      // ── Client-only tabs ─────────────────────────────────────────────

      case "customers": {
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.firstName"),
            t("reports.col.lastName"),
            t("reports.col.email"),
            t("reports.col.phone"),
            t("reports.col.document"),
            t("reports.col.status"),
          ],
          rows: customers.map((c) => ({
            id: c._id,
            columns: {
              [t("reports.col.id")]: fmtId(c._id),
              [t("reports.col.firstName")]: c.name.firstName,
              [t("reports.col.lastName")]: c.name.firstSurname,
              [t("reports.col.email")]: c.email,
              [t("reports.col.phone")]: c.phone,
              [t("reports.col.document")]: `${c.documentType} ${c.documentNumber}`,
              [t("reports.col.status")]: c.status,
            },
          })),
        };
      }

      case "requests": {
        const filtered = requests.filter((r) => matchesDate(r.startDate));
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.customerId"),
            t("reports.col.status"),
            t("reports.col.startDate"),
            t("reports.col.endDate"),
            t("reports.col.items"),
          ],
          rows: filtered.map((r) => ({
            id: r._id,
            columns: {
              [t("reports.col.id")]: fmtId(r._id),
              [t("reports.col.customerId")]: fmtId(getReferenceId(r.customerId)),
              [t("reports.col.status")]: r.status,
              [t("reports.col.startDate")]: fmtDate(r.startDate),
              [t("reports.col.endDate")]: fmtDate(r.endDate),
              [t("reports.col.items")]: r.items?.length ? r.items.length.toString() : "—",
            },
          })),
        };
      }

      case "team": {
        const filtered = teamMembers.filter((u) => {
          if (filters.team.status && u.status !== filters.team.status) return false;
          return true;
        });
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.name"),
            t("reports.col.email"),
            t("reports.col.role"),
            t("reports.col.status"),
          ],
          rows: filtered.map((u) => ({
            id: u.id,
            columns: {
              [t("reports.col.id")]: fmtId(u.id),
              [t("reports.col.name")]: u.name,
              [t("reports.col.email")]: u.email,
              [t("reports.col.role")]: u.role,
              [t("reports.col.status")]: u.status,
            },
          })),
        };
      }

      case "locations": {
        const filtered = locations.filter((l) => {
          if (filters.locations.status && l.status !== filters.locations.status) return false;
          return true;
        });
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.name"),
            t("reports.col.organization"),
            t("reports.col.status"),
            t("reports.col.city"),
            t("reports.col.department"),
            t("reports.col.address"),
          ],
          rows: filtered.map((l) => ({
            id: l._id,
            columns: {
              [t("reports.col.id")]: fmtId(l._id),
              [t("reports.col.name")]: l.name,
              [t("reports.col.organization")]: fmtId(l.organizationId) || "—",
              [t("reports.col.status")]: l.status,
              [t("reports.col.city")]: l.address?.city || "—",
              [t("reports.col.department")]: l.address?.department || "—",
              [t("reports.col.address")]:
                `${l.address?.streetType || ""} ${l.address?.primaryNumber || ""}`.trim() || "—",
            },
          })),
        };
      }

      case "orders": {
        const filtered = orders.filter((o) => {
          if (filters.orders.status && o.status !== filters.orders.status) return false;
          return matchesDate(o.date);
        });
        return {
          headers: [
            t("reports.col.orderId"),
            t("reports.col.customer"),
            t("reports.col.date"),
            t("reports.col.items"),
            t("reports.col.total"),
            t("reports.col.status"),
            t("reports.col.rentalStart"),
            t("reports.col.rentalEnd"),
          ],
          rows: filtered.map((o) => ({
            id: o.id,
            columns: {
              [t("reports.col.orderId")]: o.orderId,
              [t("reports.col.customer")]: o.customer,
              [t("reports.col.date")]: fmtDate(o.date),
              [t("reports.col.items")]: o.items.toString(),
              [t("reports.col.total")]: fmtCurrency(o.total),
              [t("reports.col.status")]: o.status,
              [t("reports.col.rentalStart")]: fmtDate(o.rentalStart),
              [t("reports.col.rentalEnd")]: fmtDate(o.rentalEnd),
            },
          })),
        };
      }

      // ── API-backed tabs ──────────────────────────────────────────────

      case "loans": {
        const data = loansQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.customer"),
            t("reports.col.email"),
            t("reports.col.status"),
            t("reports.col.startDate"),
            t("reports.col.endDate"),
            t("reports.col.durationDays"),
            t("reports.col.overdueDays"),
            t("reports.col.materials"),
          ],
          rows: data.loans.map((l) => ({
            id: l._id,
            columns: {
              [t("reports.col.id")]: fmtId(l._id),
              [t("reports.col.customer")]: l.customer.name,
              [t("reports.col.email")]: l.customer.email,
              [t("reports.col.status")]: l.status,
              [t("reports.col.startDate")]: fmtDate(l.startDate),
              [t("reports.col.endDate")]: fmtDate(l.endDate),
              [t("reports.col.durationDays")]: l.durationDays,
              [t("reports.col.overdueDays")]: l.overdueDays,
              [t("reports.col.materials")]: l.materialInstances.length,
            },
          })),
        };
      }

      case "financial": {
        const data = financialQuery.data;
        if (!data) return { headers: [], rows: [] };
        const filteredInvoices = filters.financial.type
          ? data.invoices.filter((inv) => inv.type === filters.financial.type)
          : data.invoices;
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.customer"),
            t("reports.col.email"),
            t("reports.col.type"),
            t("reports.col.status"),
            t("reports.col.amount"),
            t("reports.col.amountPaid"),
            t("reports.col.amountDue"),
            t("reports.col.createdAt"),
            t("reports.col.dueDate"),
          ],
          rows: filteredInvoices.map((inv) => ({
            id: inv._id,
            columns: {
              [t("reports.col.id")]: fmtId(inv._id),
              [t("reports.col.customer")]: inv.customer.name,
              [t("reports.col.email")]: inv.customer.email,
              [t("reports.col.type")]: inv.type,
              [t("reports.col.status")]: inv.status,
              [t("reports.col.amount")]: fmtCurrency(inv.total),
              [t("reports.col.amountPaid")]: fmtCurrency(inv.amountPaid),
              [t("reports.col.amountDue")]: fmtCurrency(inv.amountDue),
              [t("reports.col.createdAt")]: fmtDate(inv.createdAt),
              [t("reports.col.dueDate")]: fmtDate(inv.dueDate),
            },
          })),
        };
      }

      case "inventory": {
        const data = inventoryQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.name"),
            t("reports.col.identifier"),
            t("reports.col.totalInstances"),
            t("reports.col.availableCount"),
            t("reports.col.loanedCount"),
            t("reports.col.maintenanceCount"),
            t("reports.col.damagedCount"),
          ],
          rows: data.inventory.map((item) => {
            const getCount = (status: string) =>
              item.statusBreakdown.find((s) => s.status === status)?.count ?? 0;
            return {
              id: item.materialType._id,
              columns: {
                [t("reports.col.name")]: item.materialType.name,
                [t("reports.col.identifier")]: item.materialType.identifier,
                [t("reports.col.totalInstances")]: item.totalInstances,
                [t("reports.col.availableCount")]: getCount("available"),
                [t("reports.col.loanedCount")]: getCount("loaned"),
                [t("reports.col.maintenanceCount")]: getCount("maintenance"),
                [t("reports.col.damagedCount")]: getCount("damaged"),
              },
            };
          }),
        };
      }

      case "damages": {
        const data = damagesQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.inspectionId"),
            t("reports.col.loanId"),
            t("reports.col.customer"),
            t("reports.col.inspectedAt"),
            t("reports.col.conditionBefore"),
            t("reports.col.conditionAfter"),
            t("reports.col.damageDescription"),
            t("reports.col.chargeToCustomer"),
            t("reports.col.estimatedRepairCost"),
          ],
          rows: data.damages.map((d) => ({
            id: d.inspectionId,
            columns: {
              [t("reports.col.inspectionId")]: fmtId(d.inspectionId),
              [t("reports.col.loanId")]: fmtId(d.loanId),
              [t("reports.col.customer")]: d.customer.name,
              [t("reports.col.inspectedAt")]: fmtDate(d.inspectedAt),
              [t("reports.col.conditionBefore")]: d.item.conditionBefore,
              [t("reports.col.conditionAfter")]: d.item.conditionAfter,
              [t("reports.col.damageDescription")]: d.item.damageDescription || "—",
              [t("reports.col.chargeToCustomer")]: fmtCurrency(d.item.chargeToCustomer),
              [t("reports.col.estimatedRepairCost")]: fmtCurrency(d.item.estimatedRepairCost),
            },
          })),
        };
      }

      case "transfers": {
        const data = transfersQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.id"),
            t("reports.col.from"),
            t("reports.col.to"),
            t("reports.col.status"),
            t("reports.col.items"),
            t("reports.col.notes"),
            t("reports.col.createdAt"),
          ],
          rows: data.transfers.map((tr) => ({
            id: tr._id,
            columns: {
              [t("reports.col.id")]: fmtId(tr._id),
              [t("reports.col.from")]: tr.fromLocation.name,
              [t("reports.col.to")]: tr.toLocation.name,
              [t("reports.col.status")]: tr.status,
              [t("reports.col.items")]: tr.items.length.toString(),
              [t("reports.col.notes")]: tr.notes || "—",
              [t("reports.col.createdAt")]: fmtDate(tr.createdAt),
            },
          })),
        };
      }

      default:
        return { headers: [], rows: [] };
    }
  }, [
    activeModule,
    t,
    formatDate,
    formatCurrency,
    dateRange,
    customers,
    requests,
    teamMembers,
    locations,
    orders,
    loansQuery.data,
    financialQuery.data,
    inventoryQuery.data,
    damagesQuery.data,
    transfersQuery.data,
    filters.team.status,
    filters.locations.status,
    filters.orders.status,
    filters.financial.type,
  ]);

  // ─── KPI Cards ─────────────────────────────────────────────────────────

  const kpiCards: StatCardProps[] = useMemo(() => {
    const fmtCurrency = (val: number): string => formatCurrency(val, "COP");

    switch (activeModule) {
      case "customers":
        return [
          { label: t("reports.kpi.total"), value: customers.length, icon: <Users size={24} /> },
          {
            label: t("reports.kpi.active"),
            value: customers.filter((c) => c.status === "active").length,
            icon: <Users size={24} />,
            trend: t("reports.status.active"),
            trendUp: true,
          },
          {
            label: t("reports.kpi.inactive"),
            value: customers.filter((c) => c.status === "inactive").length,
            icon: <Users size={24} />,
          },
          {
            label: t("reports.kpi.blacklisted"),
            value: customers.filter((c) => c.status === "blacklisted").length,
            icon: <Users size={24} />,
          },
        ];

      case "requests":
        return [
          {
            label: t("reports.kpi.total"),
            value: requests.length,
            icon: <ClipboardList size={24} />,
          },
          {
            label: t("reports.kpi.pending"),
            value: requests.filter((r) => r.status === "pending").length,
            icon: <ClipboardList size={24} />,
          },
          {
            label: t("reports.kpi.approved"),
            value: requests.filter((r) => r.status === "approved").length,
            icon: <ClipboardList size={24} />,
            trend: t("reports.status.approved"),
            trendUp: true,
          },
          {
            label: t("reports.kpi.rejected"),
            value: requests.filter((r) => r.status === "rejected").length,
            icon: <ClipboardList size={24} />,
          },
        ];

      case "loans": {
        const summary = loansQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.totalLoans"),
            value: summary?.totalLoans ?? 0,
            icon: <TrendingUp size={24} />,
          },
          {
            label: t("reports.kpi.active"),
            value: getBreakdownCount(summary?.statusBreakdown, "active"),
            icon: <TrendingUp size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.overdue"),
            value: getBreakdownCount(summary?.statusBreakdown, "overdue"),
            icon: <TrendingUp size={24} />,
          },
          {
            label: t("reports.kpi.returned"),
            value: getBreakdownCount(summary?.statusBreakdown, "returned"),
            icon: <TrendingUp size={24} />,
          },
        ];
      }

      case "financial": {
        const data = financialQuery.data;
        const totalRevenue =
          data?.summaryByType?.reduce((sum, s) => sum + s.totalRevenue, 0) ?? 0;
        const paidAmount =
          data?.summaryByStatus?.find((s) => s._id === "paid")?.totalAmount ?? 0;
        const outstandingAmount =
          data?.summaryByStatus?.find((s) => s._id === "pending")?.totalAmount ?? 0;
        return [
          {
            label: t("reports.kpi.totalInvoices"),
            value: data?.total ?? 0,
            icon: <FileText size={24} />,
          },
          {
            label: t("reports.kpi.totalRevenue"),
            value: fmtCurrency(totalRevenue),
            icon: <DollarSign size={24} />,
          },
          {
            label: t("reports.kpi.totalPaid"),
            value: fmtCurrency(paidAmount),
            icon: <DollarSign size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.totalOutstanding"),
            value: fmtCurrency(outstandingAmount),
            icon: <DollarSign size={24} />,
          },
        ];
      }

      case "inventory": {
        const summary = inventoryQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.totalTypes"),
            value: summary?.totalTypes ?? 0,
            icon: <Package size={24} />,
          },
          {
            label: t("reports.kpi.totalInstances"),
            value: summary?.totalInstances ?? 0,
            icon: <Package size={24} />,
          },
        ];
      }

      case "damages": {
        const summary = damagesQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.totalDamages"),
            value: summary?.totalDamages ?? 0,
            icon: <Hammer size={24} />,
          },
          {
            label: t("reports.kpi.totalCharges"),
            value: fmtCurrency(summary?.totalCharges ?? 0),
            icon: <DollarSign size={24} />,
          },
          {
            label: t("reports.kpi.repairCost"),
            value: fmtCurrency(summary?.totalRepairCost ?? 0),
            icon: <DollarSign size={24} />,
          },
        ];
      }

      case "transfers": {
        const data = transfersQuery.data;
        const inTransit = data?.summaryByStatus?.find((s) => s._id === "in_transit")?.count ?? 0;
        const completed = data?.summaryByStatus?.find((s) => s._id === "completed")?.count ?? 0;
        return [
          {
            label: t("reports.kpi.totalTransfers"),
            value: data?.total ?? 0,
            icon: <ArrowLeftRight size={24} />,
          },
          {
            label: t("reports.kpi.inTransit"),
            value: inTransit,
            icon: <ArrowLeftRight size={24} />,
          },
          {
            label: t("reports.kpi.completed"),
            value: completed,
            icon: <ArrowLeftRight size={24} />,
            trendUp: true,
          },
        ];
      }

      case "team":
        return [
          {
            label: t("reports.kpi.totalMembers"),
            value: teamMembers.length,
            icon: <Users size={24} />,
          },
          {
            label: t("reports.kpi.active"),
            value: teamMembers.filter((u) => u.status === "active").length,
            icon: <Users size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.roles"),
            value: new Set(teamMembers.map((u) => u.role)).size,
            icon: <Package size={24} />,
          },
        ];

      case "locations":
        return [
          {
            label: t("reports.kpi.totalLocations"),
            value: locations.length,
            icon: <Boxes size={24} />,
          },
          {
            label: t("reports.kpi.available"),
            value: locations.filter((l) => l.status === "available").length,
            icon: <Boxes size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.fullCapacity"),
            value: locations.filter((l) => l.status === "full_capacity").length,
            icon: <Boxes size={24} />,
          },
        ];

      case "orders":
        return [
          {
            label: t("reports.kpi.totalOrders"),
            value: orders.length,
            icon: <ShoppingCart size={24} />,
          },
          {
            label: t("reports.kpi.pending"),
            value: orders.filter((o) => o.status === "pending").length,
            icon: <ShoppingCart size={24} />,
          },
          {
            label: t("reports.kpi.completed"),
            value: orders.filter((o) => o.status === "completed").length,
            icon: <ShoppingCart size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.revenue"),
            value: fmtCurrency(orders.reduce((sum, o) => sum + (o.total || 0), 0)),
            icon: <DollarSign size={24} />,
          },
        ];

      default:
        return [];
    }
  }, [
    activeModule,
    t,
    formatCurrency,
    customers,
    requests,
    teamMembers,
    locations,
    orders,
    loansQuery.data,
    financialQuery.data,
    inventoryQuery.data,
    damagesQuery.data,
    transfersQuery.data,
  ]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleModuleChange = (mod: ReportModule) => {
    setActiveModule(mod);
    setPage(1);
  };

  const setFilter = <M extends ReportModule>(
    mod: M,
    key: keyof ModuleFilters[M],
    value: ModuleFilters[M][keyof ModuleFilters[M]],
  ) => {
    setFilters((prev) => ({ ...prev, [mod]: { ...prev[mod], [key]: value } }));
    setPage(1);
  };

  const handleRefresh = () => {
    if (API_TABS.has(activeModule)) {
      void activeQuery?.refetch();
    } else {
      void fetchClientData();
    }
  };

  const handleExport = () => {
    const filename = `report_${activeModule}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(headers, rows, filename);
  };

  const handleExportPDF = () => {
    const date = new Date().toISOString().slice(0, 10);
    const exportData = { headers, rows: rows.map((r) => r.columns) };
    const title = `${moduleConfig[activeModule].label} Report`;
    exportTableToPDF(exportData, `report_${activeModule}_${date}.pdf`, title);
  };

  const handleExportXLSX = () => {
    const date = new Date().toISOString().slice(0, 10);
    const exportData = { headers, rows: rows.map((r) => r.columns) };
    exportTableToXLSX(exportData, `report_${activeModule}_${date}.xlsx`);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  if (!hasPermission("reports:read")) return <Unauthorized />;

  return (
    <div className="page-container">
      <div data-help-id="reports-header">
        <PageHeader
          title={t("reports.title")}
          subtitle={t("reports.subtitle")}
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-gray-300 rounded-lg hover:border-yellow-400 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {t("reports.refresh")}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={loading || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
              >
                <FileText size={16} />
                PDF
              </button>
              <button
                onClick={handleExportXLSX}
                disabled={loading || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
              >
                <Table2 size={16} />
                XLS
              </button>
              <button
                onClick={handleExport}
                disabled={loading || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
              >
                <Download size={16} />
                CSV
              </button>
            </div>
          }
        />
      </div>

      {/* Module Tabs */}
      <div className="flex flex-wrap gap-2" data-help-id="reports-modules">
        {(
          Object.entries(moduleConfig) as [ReportModule, (typeof moduleConfig)[ReportModule]][]
        ).map(([mod, cfg]) => (
          <button
            key={mod}
            onClick={() => handleModuleChange(mod)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${
              activeModule === mod
                ? "bg-yellow-400 text-black border-yellow-400"
                : "bg-zinc-900 border-zinc-700 text-gray-300 hover:border-yellow-400 hover:text-white"
            }`}
          >
            {cfg.icon}
            {cfg.label}
          </button>
        ))}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-help-id="reports-kpis">
        {kpiCards.map((card, i) => (
          <StatCard
            key={i}
            label={card.label}
            value={card.value}
            icon={card.icon}
            trend={card.trend}
            trendUp={card.trendUp}
          />
        ))}
      </div>

      {/* Filters */}
      <div data-help-id="reports-filters">
        <ReportsFilters
          activeModule={activeModule}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          filters={filters}
          onFilterChange={setFilter}
          onPageReset={() => setPage(1)}
          isEs={isEs}
        />
      </div>

      {/* Data Table */}
      <div data-help-id="reports-table">
        <ReportsTable
          headers={headers}
          rows={rows}
          loading={loading}
          error={error}
          page={page}
          onPageChange={setPage}
          moduleLabel={moduleConfig[activeModule].label}
          isEs={isEs}
        />
      </div>
    </div>
  );
}
