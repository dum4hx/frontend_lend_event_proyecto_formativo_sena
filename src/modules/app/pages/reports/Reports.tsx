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
} from "lucide-react";
import { StatCard } from "../../components";
import { PageHeader } from "../../../../components/ui";
import { getCustomers } from "../../../../services/customerService";
import { getRequests, getLoans } from "../../../../services/loanService";
import { getInvoices, getInvoicesSummary } from "../../../../services/invoiceService";
import { getUsers } from "../../../../services/userService";
import {
  getMaterialTypes,
  getMaterialInstances,
  getMaterialCategories,
} from "../../../../services/materialService";
import { getLocations } from "../../../../services/warehouseOperatorService";
import { commercialAdvisorService } from "../../../../services/commercialAdvisorService";
import { ApiError } from "../../../../lib/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import {
  fmtCurrency,
  fmtDate,
  fmtId,
  getReferenceId,
  getCategoryName,
  exportToCSV,
} from "./helpers";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsTable } from "./ReportsTable";
import type {
  ReportModule,
  DateRange,
  ModuleFilters,
  ReportRow,
  KpiCard,
  Customer,
  Loan,
  LoanRequest,
  Invoice,
  InvoiceSummary,
  MaterialType,
  MaterialInstance,
  MaterialCategory,
  WarehouseLocation,
  Order,
} from "./types";

// ─── Module config ─────────────────────────────────────────────────────────

const MODULE_CONFIG: Record<
  ReportModule,
  { label: string; icon: React.ReactNode; description: string }
> = {
  customers: {
    label: "Customers",
    icon: <Users size={18} />,
    description: "Customer base and activity",
  },
  requests: {
    label: "Transfer Requests",
    icon: <Send size={18} />,
    description: "Transfer requests and approvals",
  },
  loans: {
    label: "Loans",
    icon: <TrendingUp size={18} />,
    description: "Active and completed loans",
  },
  invoices: {
    label: "Invoices",
    icon: <DollarSign size={18} />,
    description: "Billing and payments",
  },
  inventory: {
    label: "Inventory",
    icon: <Package size={18} />,
    description: "Categories, types and material instances",
  },
  team: {
    label: "Team",
    icon: <Users size={18} />,
    description: "Team members and roles",
  },
  locations: {
    label: "Locations",
    icon: <Boxes size={18} />,
    description: "Warehouse locations and capacity",
  },
  orders: {
    label: "Orders",
    icon: <ShoppingCart size={18} />,
    description: "Customer orders and sales",
  },
};

// ─── Main Component ────────────────────────────────────────────────────────

export default function Reports() {
  const { language } = useLanguage();
  const isEs = language === "es";

  const moduleConfig = useMemo(() => {
    if (!isEs) return MODULE_CONFIG;
    return {
      customers: {
        ...MODULE_CONFIG.customers,
        label: "Clientes",
        description: "Base de clientes y actividad",
      },
      requests: {
        ...MODULE_CONFIG.requests,
        label: "Solicitudes",
        description: "Solicitudes y aprobaciones",
      },
      loans: {
        ...MODULE_CONFIG.loans,
        label: "Prestamos",
        description: "Prestamos activos y completados",
      },
      invoices: {
        ...MODULE_CONFIG.invoices,
        label: "Facturas",
        description: "Facturacion y pagos",
      },
      inventory: {
        ...MODULE_CONFIG.inventory,
        label: "Inventario",
        description: "Categorias, tipos e instancias",
      },
      team: { ...MODULE_CONFIG.team, label: "Equipo", description: "Miembros y roles" },
      locations: {
        ...MODULE_CONFIG.locations,
        label: "Ubicaciones",
        description: "Ubicaciones y capacidad",
      },
      orders: { ...MODULE_CONFIG.orders, label: "Pedidos", description: "Pedidos y ventas" },
    } as typeof MODULE_CONFIG;
  }, [isEs]);

  // ─── State ──────────────────────────────────────────────────────────────

  const [activeModule, setActiveModule] = useState<ReportModule>("customers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [filters, setFilters] = useState<ModuleFilters>({
    customers: { status: "" },
    requests: { status: "" },
    loans: { status: "", overdue: false },
    invoices: { status: "", type: "" },
    inventory: { type: "", status: "" },
    team: { status: "" },
    locations: { status: "" },
    orders: { status: "" },
  });

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [materialInstances, setMaterialInstances] = useState<MaterialInstance[]>([]);
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; email: string; role: string; status: string }>
  >([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // ─── Fetch data ────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
        case "loans": {
          const res = await getLoans({
            limit: 100,
            status: filters.loans.status || undefined,
            overdue: filters.loans.overdue || undefined,
          });
          setLoans(res.data.loans ?? []);
          break;
        }
        case "invoices": {
          const [invoicesRes, summaryRes] = await Promise.all([
            getInvoices({
              limit: 100,
              status: filters.invoices.status || undefined,
              type: filters.invoices.type || undefined,
            }),
            getInvoicesSummary(),
          ]);
          setInvoices(invoicesRes.data.invoices ?? []);
          setInvoiceSummary(summaryRes.data);
          break;
        }
        case "inventory": {
          const [typesRes, instancesRes, categoriesRes] = await Promise.all([
            getMaterialTypes({ limit: 100 }),
            getMaterialInstances({
              status: (filters.inventory.status as MaterialInstance["status"]) || undefined,
            }),
            getMaterialCategories(),
          ]);

          const instances = instancesRes.data.instances ?? [];
          const types = typesRes.data.materialTypes ?? [];
          const cats = categoriesRes.data.categories ?? [];

          setMaterialTypes(types);
          setMaterialInstances(instances);
          setCategories(cats);
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
          const locationsData = res.data.items ?? [];
          setLocations(locationsData);
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
        setError(err.message);
      } else {
        setError(
          isEs
            ? "No se pudieron cargar los datos. Intenta de nuevo."
            : "Failed to load data. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [activeModule, filters, isEs]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ─── Build rows ────────────────────────────────────────────────────────

  const { headers, rows } = useMemo<{ headers: string[]; rows: ReportRow[] }>(() => {
    const matchesDate = (iso: string | undefined) => {
      if (!iso) return true;
      if (dateRange.from && iso < dateRange.from) return false;
      if (dateRange.to && iso > dateRange.to + "T23:59:59") return false;
      return true;
    };

    switch (activeModule) {
      case "customers": {
        const filtered = customers.filter(() => matchesDate(undefined));
        return {
          headers: ["ID", "First Name", "Last Name", "Email", "Phone", "Document", "Status"],
          rows: filtered.map((c) => ({
            id: c._id,
            columns: {
              ID: fmtId(c._id),
              "First Name": c.name.firstName,
              "Last Name": c.name.firstSurname,
              Email: c.email,
              Phone: c.phone,
              Document: `${c.documentType} ${c.documentNumber}`,
              Status: c.status,
            },
          })),
        };
      }

      case "requests": {
        const filtered = requests.filter((r) => matchesDate(r.startDate));
        return {
          headers: ["ID", "Customer ID", "Status", "Start Date", "End Date", "Items"],
          rows: filtered.map((r) => ({
            id: r._id,
            columns: {
              ID: fmtId(r._id),
              "Customer ID": fmtId(getReferenceId(r.customerId)),
              Status: r.status,
              "Start Date": fmtDate(r.startDate),
              "End Date": fmtDate(r.endDate),
              Items: r.items?.length ? r.items.length.toString() : "—",
            },
          })),
        };
      }

      case "loans": {
        const filtered = loans.filter((l) => matchesDate(l.startDate));
        return {
          headers: ["ID", "Customer ID", "Status", "Start Date", "End Date", "Notes"],
          rows: filtered.map((l) => ({
            id: l._id,
            columns: {
              ID: fmtId(l._id),
              "Customer ID": fmtId(getReferenceId(l.customerId)),
              Status: l.status,
              "Start Date": fmtDate(l.startDate),
              "End Date": fmtDate(l.endDate),
              Notes: l.notes ?? "—",
            },
          })),
        };
      }

      case "invoices": {
        const filtered = invoices.filter(() => matchesDate(undefined));
        return {
          headers: ["ID", "Customer ID", "Type", "Status", "Amount (COP)", "Loan ID"],
          rows: filtered.map((i) => ({
            id: i._id,
            columns: {
              ID: fmtId(i._id),
              "Customer ID":
                typeof i.customerId === "object" && i.customerId !== null
                  ? fmtId(i.customerId._id)
                  : fmtId(i.customerId as string),
              Type: i.type,
              Status: i.status,
              "Amount (COP)": fmtCurrency(i.totalAmount),
              "Loan ID": i.loanId
                ? fmtId(typeof i.loanId === "object" ? i.loanId._id : i.loanId)
                : "—",
            },
          })),
        };
      }

      case "inventory": {
        const filterType = filters.inventory.type;

        if (filterType === "categories") {
          return {
            headers: ["ID", "Name", "Description"],
            rows: categories.map((c) => ({
              id: c._id,
              columns: {
                ID: fmtId(c._id),
                Name: c.name,
                Description: c.description || "—",
              },
            })),
          };
        } else if (filterType === "types") {
          return {
            headers: ["ID", "Name", "Category", "Price/Day", "Description"],
            rows: materialTypes.map((mt) => {
              const categoryName = getCategoryName(mt.categoryId, categories);
              return {
                id: mt._id,
                columns: {
                  ID: fmtId(mt._id),
                  Name: mt.name,
                  Category: categoryName,
                  "Price/Day": fmtCurrency(mt.pricePerDay ?? 0),
                  Description: mt.description || "—",
                },
              };
            }),
          };
        } else {
          const filtered = materialInstances.filter((m) => {
            if (filters.inventory.status && m.status !== filters.inventory.status) return false;
            return true;
          });

          return {
            headers: ["Serial", "Model", "Status", "Location", "Price/Day", "Description"],
            rows: filtered.map((m) => ({
              id: m._id,
              columns: {
                Serial: m.serialNumber || "—",
                Model: m.model?.name || "—",
                Status: m.status || "—",
                Location: m.locationId?.name || "—",
                "Price/Day": m.model?.pricePerDay ? fmtCurrency(m.model.pricePerDay) : "—",
                Description: m.model?.description || "—",
              },
            })),
          };
        }
      }

      case "team": {
        const filtered = teamMembers.filter((u) => {
          if (filters.team.status && u.status !== filters.team.status) return false;
          return true;
        });
        return {
          headers: ["ID", "Name", "Email", "Role", "Status"],
          rows: filtered.map((u) => ({
            id: u.id,
            columns: {
              ID: fmtId(u.id),
              Name: u.name,
              Email: u.email,
              Role: u.role,
              Status: u.status,
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
          headers: ["ID", "Name", "Organization", "Status", "City", "Department", "Address"],
          rows: filtered.map((l) => ({
            id: l._id,
            columns: {
              ID: fmtId(l._id),
              Name: l.name,
              Organization: fmtId(l.organizationId) || "—",
              Status: l.status,
              City: l.address?.city || "—",
              Department: l.address?.department || "—",
              Address:
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
            "Order ID",
            "Customer",
            "Date",
            "Items",
            "Total",
            "Status",
            "Rental Start",
            "Rental End",
          ],
          rows: filtered.map((o) => ({
            id: o.id,
            columns: {
              "Order ID": o.orderId,
              Customer: o.customer,
              Date: fmtDate(o.date),
              Items: o.items.toString(),
              Total: fmtCurrency(o.total),
              Status: o.status,
              "Rental Start": fmtDate(o.rentalStart),
              "Rental End": fmtDate(o.rentalEnd),
            },
          })),
        };
      }

      default:
        return { headers: [], rows: [] };
    }
  }, [
    activeModule,
    customers,
    requests,
    loans,
    invoices,
    materialTypes,
    materialInstances,
    teamMembers,
    locations,
    categories,
    orders,
    filters.inventory.type,
    filters.inventory.status,
    filters.locations.status,
    filters.team.status,
    filters.orders.status,
    dateRange,
  ]);

  // ─── KPI Cards ─────────────────────────────────────────────────────────

  const kpiCards: KpiCard[] = useMemo(() => {
    switch (activeModule) {
      case "customers":
        return [
          { label: "Total", value: customers.length, icon: <Users size={24} /> },
          {
            label: "Active",
            value: customers.filter((c) => c.status === "active").length,
            icon: <Users size={24} />,
            trend: "active",
            trendUp: true,
          },
          {
            label: "Inactive",
            value: customers.filter((c) => c.status === "inactive").length,
            icon: <Users size={24} />,
          },
          {
            label: "Blacklisted",
            value: customers.filter((c) => c.status === "blacklisted").length,
            icon: <Users size={24} />,
          },
        ];
      case "requests":
        return [
          { label: "Total", value: requests.length, icon: <ClipboardList size={24} /> },
          {
            label: "Pending",
            value: requests.filter((r) => r.status === "pending").length,
            icon: <ClipboardList size={24} />,
          },
          {
            label: "Approved",
            value: requests.filter((r) => r.status === "approved").length,
            icon: <ClipboardList size={24} />,
            trend: "approved",
            trendUp: true,
          },
          {
            label: "Rejected",
            value: requests.filter((r) => r.status === "rejected").length,
            icon: <ClipboardList size={24} />,
          },
        ];
      case "loans":
        return [
          { label: "Total", value: loans.length, icon: <TrendingUp size={24} /> },
          {
            label: "Active",
            value: loans.filter((l) => l.status === "active").length,
            icon: <TrendingUp size={24} />,
            trendUp: true,
          },
          {
            label: "Overdue",
            value: loans.filter((l) => l.status === "overdue").length,
            icon: <TrendingUp size={24} />,
          },
          {
            label: "Returned",
            value: loans.filter((l) => l.status === "returned").length,
            icon: <TrendingUp size={24} />,
          },
        ];
      case "invoices":
        return [
          { label: "Total Invoices", value: invoices.length, icon: <FileText size={24} /> },
          {
            label: "Pending",
            value:
              invoiceSummary?.pending.count ??
              invoices.filter((i) => i.status === "pending").length,
            icon: <DollarSign size={24} />,
          },
          {
            label: "Paid",
            value: invoiceSummary?.paid.count ?? invoices.filter((i) => i.status === "paid").length,
            icon: <DollarSign size={24} />,
            trendUp: true,
          },
          {
            label: "Total Amount",
            value: fmtCurrency(invoices.reduce((sum, i) => sum + (i.totalAmount ?? 0), 0)),
            icon: <DollarSign size={24} />,
          },
        ];
      case "inventory": {
        const filterType = filters.inventory.type;
        if (filterType === "categories") {
          return [
            { label: "Total Categories", value: categories.length, icon: <Package size={24} /> },
            { label: "Material Types", value: materialTypes.length, icon: <Package size={24} /> },
            { label: "Instances", value: materialInstances.length, icon: <Package size={24} /> },
            {
              label: "With Attributes",
              value: categories.filter((c) => c.attributes && c.attributes.length > 0).length,
              icon: <Package size={24} />,
            },
          ];
        } else if (filterType === "types") {
          return [
            { label: "Total Types", value: materialTypes.length, icon: <Package size={24} /> },
            { label: "Categories", value: categories.length, icon: <Package size={24} /> },
            { label: "Instances", value: materialInstances.length, icon: <Package size={24} /> },
            {
              label: "Avg Price/Day",
              value: fmtCurrency(
                materialTypes.reduce((sum, mt) => sum + (mt.pricePerDay || 0), 0) /
                  (materialTypes.length || 1),
              ),
              icon: <Package size={24} />,
            },
          ];
        } else {
          return [
            {
              label: "Total Instances",
              value: materialInstances.length,
              icon: <Package size={24} />,
            },
            {
              label: "Available",
              value: materialInstances.filter((mi) => mi.status === "available").length,
              icon: <Package size={24} />,
              trendUp: true,
            },
            {
              label: "Loaned",
              value: materialInstances.filter((mi) => mi.status === "loaned").length,
              icon: <Package size={24} />,
            },
            {
              label: "Maintenance",
              value: materialInstances.filter((mi) => mi.status === "maintenance").length,
              icon: <Package size={24} />,
            },
          ];
        }
      }
      case "team":
        return [
          { label: "Total Members", value: teamMembers.length, icon: <Users size={24} /> },
          {
            label: "Active",
            value: teamMembers.filter((u) => u.status === "active").length,
            icon: <Users size={24} />,
            trendUp: true,
          },
          {
            label: "Invited",
            value: teamMembers.filter((u) => u.status === "invited").length,
            icon: <Users size={24} />,
          },
          {
            label: "Roles",
            value: new Set(teamMembers.map((u) => u.role)).size,
            icon: <Package size={24} />,
          },
        ];
      case "locations":
        return [
          { label: "Total Locations", value: locations.length, icon: <Boxes size={24} /> },
          {
            label: "Available",
            value: locations.filter((l) => l.status === "available").length,
            icon: <Boxes size={24} />,
            trendUp: true,
          },
          {
            label: "Full Capacity",
            value: locations.filter((l) => l.status === "full_capacity").length,
            icon: <Boxes size={24} />,
          },
          {
            label: "Maintenance",
            value: locations.filter((l) => l.status === "maintenance").length,
            icon: <Boxes size={24} />,
          },
        ];
      case "orders":
        return [
          { label: "Total Orders", value: orders.length, icon: <ShoppingCart size={24} /> },
          {
            label: "Pending",
            value: orders.filter((o) => o.status === "pending").length,
            icon: <ShoppingCart size={24} />,
          },
          {
            label: "Completed",
            value: orders.filter((o) => o.status === "completed").length,
            icon: <ShoppingCart size={24} />,
            trendUp: true,
          },
          {
            label: "Revenue",
            value: fmtCurrency(orders.reduce((sum, o) => sum + (o.total || 0), 0)),
            icon: <DollarSign size={24} />,
          },
        ];
      default:
        return [];
    }
  }, [
    activeModule,
    customers,
    requests,
    loans,
    invoices,
    materialTypes,
    materialInstances,
    teamMembers,
    locations,
    categories,
    orders,
    invoiceSummary,
    filters.inventory.type,
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

  const handleExport = () => {
    const filename = `report_${activeModule}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(headers, rows, filename);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      <PageHeader
        title={isEs ? "Reportes y analitica" : "Reports & Analytics"}
        subtitle={isEs ? "Explora datos en todos los modulos" : "Explore data across all modules"}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => void fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-gray-300 rounded-lg hover:border-yellow-400 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {isEs ? "Actualizar" : "Refresh"}
            </button>
            <button
              onClick={handleExport}
              disabled={loading || rows.length === 0}
              className="flex items-center gap-2 px-4 py-2 gold-action-btn font-semibold rounded-lg transition disabled:opacity-50"
            >
              <Download size={16} />
              {isEs ? "Exportar CSV" : "Export CSV"}
            </button>
          </div>
        }
      />

      {/* Module Tabs */}
      <div className="flex flex-wrap gap-2">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <ReportsFilters
        activeModule={activeModule}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={filters}
        onFilterChange={setFilter}
        onPageReset={() => setPage(1)}
        isEs={isEs}
      />

      {/* Data Table */}
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
  );
}
