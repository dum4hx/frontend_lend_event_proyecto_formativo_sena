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
  AlertCircle,
} from "lucide-react";
import { StatCard } from "../../components";
import { PageHeader } from "../../../../components/ui";
import { getCustomers } from "../../../../services/customerService";
import { getRequests } from "../../../../services/loanService";
import { getUsers } from "../../../../services/userService";
import { getLocations } from "../../../../services/warehouseOperatorService";
import { commercialAdvisorService } from "../../../../services/commercialAdvisorService";
import {
  getExportLoanActivity,
  getExportSales,
  getExportInventory,
  getExportDamages,
  getExportTransfers,
} from "../../../../services/reportExportService";
import {
  useExportLoanActivity,
  useExportSales,
  useExportInventory,
  useExportDamages,
  useExportTransfers,
} from "../../../../hooks/queries";
import { ApiError } from "../../../../lib/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { usePermissions } from "../../../../contexts/usePermissions";
import Unauthorized from "../../../../pages/Unauthorized";
import { exportTableToPDF, exportTableToXLSX } from "../../../../utils/tableExport";
import { PAGE_SIZE, fmtId, exportToCSV, fetchAllPages, getReferenceId } from "./helpers";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsTable } from "./ReportsTable";
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
    loans: { status: "", overdue: false, customerId: "", locationId: "" },
    financial: {
      status: "",
      type: "",
      customerId: "",
      locationId: "",
      categoryId: "",
      invoiceType: "",
      invoiceStatus: "",
    },
    inventory: { type: "", status: "", locationId: "", categoryId: "", search: "" },
    team: { status: "" },
    locations: { status: "" },
    orders: { status: "" },
    damages: { status: "", locationId: "", batchStatus: "", entryReason: "" },
    transfers: { status: "", fromLocationId: "", toLocationId: "" },
  });

  // Client-only tab data
  const [clientLoading, setClientLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; email: string; role: string; status: string }>
  >([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // ─── API-backed report hooks (new /reports/exports/* endpoints) ──────────

  const loansQuery = useExportLoanActivity(
    {
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
      page,
      limit: PAGE_SIZE,
      status: filters.loans.status || undefined,
      customerId: filters.loans.customerId || undefined,
      locationId: filters.loans.locationId || undefined,
    },
    { enabled: activeModule === "loans" },
  );

  const financialQuery = useExportSales(
    {
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
      page,
      limit: PAGE_SIZE,
      customerId: filters.financial.customerId || undefined,
      locationId: filters.financial.locationId || undefined,
      categoryId: filters.financial.categoryId || undefined,
      invoiceType: filters.financial.invoiceType || undefined,
      invoiceStatus: filters.financial.invoiceStatus || undefined,
    },
    { enabled: activeModule === "financial" },
  );

  const inventoryQuery = useExportInventory(
    {
      locationId: filters.inventory.locationId || undefined,
      categoryId: filters.inventory.categoryId || undefined,
      status: filters.inventory.status || undefined,
      search: filters.inventory.search || undefined,
    },
    { enabled: activeModule === "inventory" },
  );

  const damagesQuery = useExportDamages(
    {
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
      page,
      limit: PAGE_SIZE,
      locationId: filters.damages.locationId || undefined,
      batchStatus: filters.damages.batchStatus || undefined,
      entryReason: filters.damages.entryReason || undefined,
    },
    { enabled: activeModule === "damages" },
  );

  const transfersQuery = useExportTransfers(
    {
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
      page,
      limit: PAGE_SIZE,
      status: filters.transfers.status || undefined,
      fromLocationId: filters.transfers.fromLocationId || undefined,
      toLocationId: filters.transfers.toLocationId || undefined,
    },
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

      // ── API-backed tabs (new /reports/exports/* shapes) ──────────────

      case "loans": {
        const data = loansQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.code"),
            t("reports.col.customer"),
            t("reports.col.locationName"),
            t("reports.col.status"),
            t("reports.col.startDate"),
            t("reports.col.endDate"),
            t("reports.col.returnedAt"),
            t("reports.col.durationDays"),
            t("reports.col.overdueDays"),
            t("reports.col.totalAmount"),
            t("reports.col.materialCount"),
          ],
          rows: data.rows.map((l) => ({
            id: l.loanId ?? l.code,
            columns: {
              [t("reports.col.code")]: l.code,
              [t("reports.col.customer")]: l.customerName,
              [t("reports.col.locationName")]: l.locationName,
              [t("reports.col.status")]: l.status,
              [t("reports.col.startDate")]: fmtDate(l.startDate),
              [t("reports.col.endDate")]: fmtDate(l.endDate),
              [t("reports.col.returnedAt")]: l.returnedAt ? fmtDate(l.returnedAt) : "—",
              [t("reports.col.durationDays")]: l.durationDays,
              [t("reports.col.overdueDays")]: l.overdueDays,
              [t("reports.col.totalAmount")]: fmtCurrency(l.totalAmount),
              [t("reports.col.materialCount")]: l.materialCount,
            },
          })),
        };
      }

      case "financial": {
        const data = financialQuery.data;
        if (!data) return { headers: [], rows: [] };
        // Show invoiceRows if type filter is set, otherwise combine loanRows + invoiceRows
        const isInvoiceView = !!filters.financial.type || !!filters.financial.invoiceType;
        if (isInvoiceView) {
          const filteredInvoices = filters.financial.type
            ? data.invoiceRows.filter((inv) => inv.type === filters.financial.type)
            : data.invoiceRows;
          return {
            headers: [
              t("reports.col.invoiceNumber"),
              t("reports.col.customer"),
              t("reports.col.type"),
              t("reports.col.status"),
              t("reports.col.amount"),
              t("reports.col.amountPaid"),
              t("reports.col.amountDue"),
              t("reports.col.createdAt"),
              t("reports.col.dueDate"),
            ],
            rows: filteredInvoices.map((inv) => ({
              id: inv.invoiceId ?? inv.invoiceNumber,
              columns: {
                [t("reports.col.invoiceNumber")]: inv.invoiceNumber,
                [t("reports.col.customer")]: inv.customerName,
                [t("reports.col.type")]: inv.type,
                [t("reports.col.status")]: inv.status,
                [t("reports.col.amount")]: fmtCurrency(inv.totalAmount),
                [t("reports.col.amountPaid")]: fmtCurrency(inv.amountPaid),
                [t("reports.col.amountDue")]: fmtCurrency(inv.amountDue),
                [t("reports.col.createdAt")]: fmtDate(inv.createdAt),
                [t("reports.col.dueDate")]: fmtDate(inv.dueDate),
              },
            })),
          };
        }
        // Default: show loan rows (combined sales view)
        return {
          headers: [
            t("reports.col.code"),
            t("reports.col.customer"),
            t("reports.col.locationName"),
            t("reports.col.startDate"),
            t("reports.col.endDate"),
            t("reports.col.totalAmount"),
            t("reports.col.depositAmount"),
            t("reports.col.status"),
            t("reports.col.materialCount"),
          ],
          rows: data.loanRows.map((l) => ({
            id: l.loanId ?? l.code,
            columns: {
              [t("reports.col.code")]: l.code,
              [t("reports.col.customer")]: l.customerName,
              [t("reports.col.locationName")]: l.locationName,
              [t("reports.col.startDate")]: fmtDate(l.startDate),
              [t("reports.col.endDate")]: fmtDate(l.endDate),
              [t("reports.col.totalAmount")]: fmtCurrency(l.totalAmount),
              [t("reports.col.depositAmount")]: fmtCurrency(l.depositAmount),
              [t("reports.col.status")]: l.status,
              [t("reports.col.materialCount")]: l.materialCount,
            },
          })),
        };
      }

      case "inventory": {
        const data = inventoryQuery.data;
        if (!data) return { headers: [], rows: [] };
        const mtypes = data.materialTypes ?? data.byMaterialType ?? [];
        return {
          headers: [
            t("reports.col.code"),
            t("reports.col.name"),
            t("reports.col.categoryNames"),
            t("reports.col.pricePerDay"),
            t("reports.col.totalInstances"),
            t("reports.col.availableCount"),
            t("reports.col.loanedCount"),
            t("reports.col.maintenanceCount"),
            t("reports.col.damagedCount"),
          ],
          rows: mtypes.map((item) => ({
            id: item.materialTypeId ?? item.code,
            columns: {
              [t("reports.col.code")]: item.code,
              [t("reports.col.name")]: item.name,
              [t("reports.col.categoryNames")]: item.categoryNames?.join(", ") || "—",
              [t("reports.col.pricePerDay")]: fmtCurrency(item.pricePerDay),
              [t("reports.col.totalInstances")]: item.totalInstances,
              [t("reports.col.availableCount")]: item.instancesByStatus?.available ?? 0,
              [t("reports.col.loanedCount")]: item.instancesByStatus?.loaned ?? 0,
              [t("reports.col.maintenanceCount")]: item.instancesByStatus?.maintenance ?? 0,
              [t("reports.col.damagedCount")]: item.instancesByStatus?.damaged ?? 0,
            },
          })),
        };
      }

      case "damages": {
        const data = damagesQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.batchNumber"),
            t("reports.col.name"),
            t("reports.col.status"),
            t("reports.col.locationName"),
            t("reports.col.assignedTo"),
            t("reports.col.itemCount"),
            t("reports.col.estimatedCost"),
            t("reports.col.actualCost"),
            t("reports.col.startDate"),
          ],
          rows: data.batches.map((b) => ({
            id: b.batchId ?? b.batchNumber,
            columns: {
              [t("reports.col.batchNumber")]: b.batchNumber,
              [t("reports.col.name")]: b.name,
              [t("reports.col.status")]: b.status,
              [t("reports.col.locationName")]: b.locationName,
              [t("reports.col.assignedTo")]: b.assignedTo,
              [t("reports.col.itemCount")]: b.itemCount,
              [t("reports.col.estimatedCost")]: fmtCurrency(b.totalEstimatedCost),
              [t("reports.col.actualCost")]: fmtCurrency(b.totalActualCost),
              [t("reports.col.startDate")]: fmtDate(b.startedAt),
            },
          })),
        };
      }

      case "transfers": {
        const data = transfersQuery.data;
        if (!data) return { headers: [], rows: [] };
        return {
          headers: [
            t("reports.col.from"),
            t("reports.col.to"),
            t("reports.col.status"),
            t("reports.col.items"),
            t("reports.col.pickedBy"),
            t("reports.col.receivedBy"),
            t("reports.col.sentAt"),
            t("reports.col.receivedAt"),
            t("reports.col.transitDays"),
          ],
          rows: data.rows.map((tr) => ({
            id: tr.transferId ?? `${tr.fromLocation}-${tr.sentAt}`,
            columns: {
              [t("reports.col.from")]: tr.fromLocation,
              [t("reports.col.to")]: tr.toLocation,
              [t("reports.col.status")]: tr.status,
              [t("reports.col.items")]: tr.itemCount.toString(),
              [t("reports.col.pickedBy")]: tr.pickedBy || "—",
              [t("reports.col.receivedBy")]: tr.receivedBy || "—",
              [t("reports.col.sentAt")]: fmtDate(tr.sentAt),
              [t("reports.col.receivedAt")]: tr.receivedAt ? fmtDate(tr.receivedAt) : "—",
              [t("reports.col.transitDays")]: tr.transitDays,
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
    filters.financial.invoiceType,
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
            label: t("reports.kpi.totalRevenue"),
            value: fmtCurrency(summary?.totalRevenue ?? 0),
            icon: <TrendingUp size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.avgDuration"),
            value: summary?.averageDurationDays ?? 0,
            icon: <TrendingUp size={24} />,
          },
          {
            label: t("reports.kpi.overdueRate"),
            value: `${((summary?.overdueRate ?? 0) * 100).toFixed(1)}%`,
            icon: <AlertCircle size={24} />,
          },
          {
            label: t("reports.kpi.returnRate"),
            value: `${((summary?.returnRate ?? 0) * 100).toFixed(1)}%`,
            icon: <TrendingUp size={24} />,
            trendUp: true,
          },
        ];
      }

      case "financial": {
        const summary = financialQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.combinedRevenue"),
            value: fmtCurrency(summary?.combinedRevenue ?? 0),
            icon: <DollarSign size={24} />,
          },
          {
            label: t("reports.kpi.loanRevenue"),
            value: fmtCurrency(summary?.totalLoanRevenue ?? 0),
            icon: <DollarSign size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.invoiceRevenue"),
            value: fmtCurrency(summary?.totalInvoiceRevenue ?? 0),
            icon: <FileText size={24} />,
          },
        ];
      }

      case "inventory": {
        const summary = inventoryQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.totalTypes"),
            value: summary?.totalMaterialTypes ?? inventoryQuery.data?.totalMaterialTypes ?? 0,
            icon: <Package size={24} />,
          },
          {
            label: t("reports.kpi.totalInstances"),
            value: summary?.totalInstances ?? inventoryQuery.data?.totalInstances ?? 0,
            icon: <Package size={24} />,
          },
          {
            label: t("reports.kpi.availabilityRate"),
            value: `${((summary?.globalAvailabilityRate ?? 0) * 100).toFixed(1)}%`,
            icon: <Package size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.utilizationRate"),
            value: `${((summary?.globalUtilizationRate ?? 0) * 100).toFixed(1)}%`,
            icon: <Package size={24} />,
          },
          {
            label: t("reports.kpi.estimatedDailyValue"),
            value: fmtCurrency(summary?.estimatedDailyValue ?? 0),
            icon: <DollarSign size={24} />,
          },
        ];
      }

      case "damages": {
        const summary = damagesQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.totalBatches"),
            value: summary?.totalBatches ?? 0,
            icon: <Hammer size={24} />,
          },
          {
            label: t("reports.kpi.totalItems"),
            value: summary?.totalItems ?? 0,
            icon: <Hammer size={24} />,
          },
          {
            label: t("reports.kpi.totalEstimatedCost"),
            value: fmtCurrency(summary?.totalEstimatedCost ?? 0),
            icon: <DollarSign size={24} />,
          },
          {
            label: t("reports.kpi.totalActualCost"),
            value: fmtCurrency(summary?.totalActualCost ?? 0),
            icon: <DollarSign size={24} />,
          },
          {
            label: t("reports.kpi.avgRepairTime"),
            value: summary?.averageRepairTimeDays ?? 0,
            icon: <Hammer size={24} />,
          },
        ];
      }

      case "transfers": {
        const summary = transfersQuery.data?.summary;
        return [
          {
            label: t("reports.kpi.totalTransfers"),
            value: summary?.totalTransfers ?? 0,
            icon: <ArrowLeftRight size={24} />,
          },
          {
            label: t("reports.kpi.totalItemsMoved"),
            value: summary?.totalItemsMoved ?? 0,
            icon: <ArrowLeftRight size={24} />,
          },
          {
            label: t("reports.kpi.avgTransitDays"),
            value: summary?.averageTransitDays ?? 0,
            icon: <ArrowLeftRight size={24} />,
          },
          {
            label: t("reports.kpi.completionRate"),
            value: `${((summary?.completionRate ?? 0) * 100).toFixed(1)}%`,
            icon: <ArrowLeftRight size={24} />,
            trendUp: true,
          },
          {
            label: t("reports.kpi.issueRate"),
            value: `${((summary?.issueRate ?? 0) * 100).toFixed(1)}%`,
            icon: <AlertCircle size={24} />,
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

  // ─── Server pagination info ──────────────────────────────────────────────

  const serverTotal = useMemo((): number | null => {
    if (!API_TABS.has(activeModule)) return null;
    switch (activeModule) {
      case "loans":
        return loansQuery.data?.pagination?.total ?? null;
      case "financial":
        return financialQuery.data?.pagination?.total ?? null;
      case "damages":
        return damagesQuery.data?.pagination?.total ?? null;
      case "transfers":
        return transfersQuery.data?.pagination?.total ?? null;
      default:
        return null;
    }
  }, [activeModule, loansQuery.data, financialQuery.data, damagesQuery.data, transfersQuery.data]);

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

  /**
   * Fetches all rows for the current API-backed tab.
   * For client-only tabs and inventory (non-paginated), returns current rows.
   */
  const getAllExportRows = useCallback(async (): Promise<ReportRow[]> => {
    if (!API_TABS.has(activeModule)) return rows;

    const fmtDate = (iso: string | undefined): string => {
      if (!iso) return "—";
      return formatDate(iso);
    };
    const fmtCurrency = (val: number): string => formatCurrency(val, "COP");

    const baseParams = {
      startDate: dateRange.from || undefined,
      endDate: dateRange.to || undefined,
    };

    switch (activeModule) {
      case "loans": {
        const allRows = await fetchAllPages(
          getExportLoanActivity,
          {
            ...baseParams,
            status: filters.loans.status || undefined,
            customerId: filters.loans.customerId || undefined,
            locationId: filters.loans.locationId || undefined,
          },
          (d) => d.rows,
        );
        return allRows.map((l) => ({
          id: l.loanId ?? l.code,
          columns: {
            [t("reports.col.code")]: l.code,
            [t("reports.col.customer")]: l.customerName,
            [t("reports.col.locationName")]: l.locationName,
            [t("reports.col.status")]: l.status,
            [t("reports.col.startDate")]: fmtDate(l.startDate),
            [t("reports.col.endDate")]: fmtDate(l.endDate),
            [t("reports.col.returnedAt")]: l.returnedAt ? fmtDate(l.returnedAt) : "—",
            [t("reports.col.durationDays")]: l.durationDays,
            [t("reports.col.overdueDays")]: l.overdueDays,
            [t("reports.col.totalAmount")]: fmtCurrency(l.totalAmount),
            [t("reports.col.materialCount")]: l.materialCount,
          },
        }));
      }

      case "financial": {
        const isInvoiceView = !!filters.financial.type || !!filters.financial.invoiceType;
        const salesParams = {
          ...baseParams,
          customerId: filters.financial.customerId || undefined,
          locationId: filters.financial.locationId || undefined,
          categoryId: filters.financial.categoryId || undefined,
          invoiceType: filters.financial.invoiceType || undefined,
          invoiceStatus: filters.financial.invoiceStatus || undefined,
        };

        if (isInvoiceView) {
          const allInvoices = await fetchAllPages(
            getExportSales,
            salesParams,
            (d) =>
              filters.financial.type
                ? d.invoiceRows.filter((inv) => inv.type === filters.financial.type)
                : d.invoiceRows,
          );
          return allInvoices.map((inv) => ({
            id: inv.invoiceId ?? inv.invoiceNumber,
            columns: {
              [t("reports.col.invoiceNumber")]: inv.invoiceNumber,
              [t("reports.col.customer")]: inv.customerName,
              [t("reports.col.type")]: inv.type,
              [t("reports.col.status")]: inv.status,
              [t("reports.col.amount")]: fmtCurrency(inv.totalAmount),
              [t("reports.col.amountPaid")]: fmtCurrency(inv.amountPaid),
              [t("reports.col.amountDue")]: fmtCurrency(inv.amountDue),
              [t("reports.col.createdAt")]: fmtDate(inv.createdAt),
              [t("reports.col.dueDate")]: fmtDate(inv.dueDate),
            },
          }));
        }

        const allLoans = await fetchAllPages(
          getExportSales,
          salesParams,
          (d) => d.loanRows,
        );
        return allLoans.map((l) => ({
          id: l.loanId ?? l.code,
          columns: {
            [t("reports.col.code")]: l.code,
            [t("reports.col.customer")]: l.customerName,
            [t("reports.col.locationName")]: l.locationName,
            [t("reports.col.startDate")]: fmtDate(l.startDate),
            [t("reports.col.endDate")]: fmtDate(l.endDate),
            [t("reports.col.totalAmount")]: fmtCurrency(l.totalAmount),
            [t("reports.col.depositAmount")]: fmtCurrency(l.depositAmount),
            [t("reports.col.status")]: l.status,
            [t("reports.col.materialCount")]: l.materialCount,
          },
        }));
      }

      case "inventory": {
        // Inventory is not paginated — return current data
        return rows;
      }

      case "damages": {
        const allBatches = await fetchAllPages(
          getExportDamages,
          {
            ...baseParams,
            locationId: filters.damages.locationId || undefined,
            batchStatus: filters.damages.batchStatus || undefined,
            entryReason: filters.damages.entryReason || undefined,
          },
          (d) => d.batches,
        );
        return allBatches.map((b) => ({
          id: b.batchId ?? b.batchNumber,
          columns: {
            [t("reports.col.batchNumber")]: b.batchNumber,
            [t("reports.col.name")]: b.name,
            [t("reports.col.status")]: b.status,
            [t("reports.col.locationName")]: b.locationName,
            [t("reports.col.assignedTo")]: b.assignedTo,
            [t("reports.col.itemCount")]: b.itemCount,
            [t("reports.col.estimatedCost")]: fmtCurrency(b.totalEstimatedCost),
            [t("reports.col.actualCost")]: fmtCurrency(b.totalActualCost),
            [t("reports.col.startDate")]: fmtDate(b.startedAt),
          },
        }));
      }

      case "transfers": {
        const allTransfers = await fetchAllPages(
          getExportTransfers,
          {
            ...baseParams,
            status: filters.transfers.status || undefined,
            fromLocationId: filters.transfers.fromLocationId || undefined,
            toLocationId: filters.transfers.toLocationId || undefined,
          },
          (d) => d.rows,
        );
        return allTransfers.map((tr) => ({
          id: tr.transferId ?? `${tr.fromLocation}-${tr.sentAt}`,
          columns: {
            [t("reports.col.from")]: tr.fromLocation,
            [t("reports.col.to")]: tr.toLocation,
            [t("reports.col.status")]: tr.status,
            [t("reports.col.items")]: tr.itemCount.toString(),
            [t("reports.col.pickedBy")]: tr.pickedBy || "—",
            [t("reports.col.receivedBy")]: tr.receivedBy || "—",
            [t("reports.col.sentAt")]: fmtDate(tr.sentAt),
            [t("reports.col.receivedAt")]: tr.receivedAt ? fmtDate(tr.receivedAt) : "—",
            [t("reports.col.transitDays")]: tr.transitDays,
          },
        }));
      }

      default:
        return rows;
    }
  }, [activeModule, rows, dateRange, filters, t, formatDate, formatCurrency]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportRows = await getAllExportRows();
      const filename = `report_${activeModule}_${new Date().toISOString().slice(0, 10)}.csv`;
      exportToCSV(headers, exportRows, filename);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const exportRows = await getAllExportRows();
      const date = new Date().toISOString().slice(0, 10);
      const exportData = { headers, rows: exportRows.map((r) => r.columns) };
      const title = `${moduleConfig[activeModule].label} Report`;
      exportTableToPDF(exportData, `report_${activeModule}_${date}.pdf`, title);
    } finally {
      setExporting(false);
    }
  };

  const handleExportXLSX = async () => {
    setExporting(true);
    try {
      const exportRows = await getAllExportRows();
      const date = new Date().toISOString().slice(0, 10);
      const exportData = { headers, rows: exportRows.map((r) => r.columns) };
      exportTableToXLSX(exportData, `report_${activeModule}_${date}.xlsx`);
    } finally {
      setExporting(false);
    }
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
              {exporting && (
                <span className="text-yellow-400 text-sm animate-pulse">
                  {t("reports.export.exporting")}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={loading || exporting}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-gray-300 rounded-lg hover:border-yellow-400 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {t("reports.refresh")}
              </button>
              <button
                onClick={() => void handleExportPDF()}
                disabled={loading || exporting || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
              >
                <FileText size={16} />
                PDF
              </button>
              <button
                onClick={() => void handleExportXLSX()}
                disabled={loading || exporting || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
              >
                <Table2 size={16} />
                XLS
              </button>
              <button
                onClick={() => void handleExport()}
                disabled={loading || exporting || rows.length === 0}
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

      {/* More records info banner */}
      {serverTotal !== null && serverTotal > rows.length && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-blue-300 text-sm">
          <AlertCircle size={16} />
          {t("reports.export.moreRecords")
            .replace("{shown}", String(rows.length))
            .replace("{total}", String(serverTotal))}
        </div>
      )}

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
