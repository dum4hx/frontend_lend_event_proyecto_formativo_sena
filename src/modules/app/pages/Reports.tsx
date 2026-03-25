import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Download,
  Users,
  DollarSign,
  FileText,
  Package,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  ClipboardList,
  Boxes,
  Send,
  ArrowRightLeft,
  ShoppingCart,
  FileSignature,
} from "lucide-react";
import { StatCard } from "../components";
import { getCustomers } from "../../../services/customerService";
import { getRequests, getLoans } from "../../../services/loanService";
import { getInvoices, getInvoicesSummary } from "../../../services/invoiceService";
import { getUsers } from "../../../services/userService";
import { getMaterialTypes, getMaterialInstances, getMaterialCategories } from "../../../services/materialService";
import { getLocations, getInventoryItems, getStockMovements, getAlerts } from "../../../services/warehouseOperatorService";
import { commercialAdvisorService } from "../../../services/commercialAdvisorService";
import { ApiError } from "../../../lib/api";
import { useLanguage } from "../../../contexts/useLanguage";
import type {
  Customer,
  Loan,
  LoanRequest,
  Invoice,
  InvoiceSummary,
  MaterialType,
  MaterialInstance,
  MaterialCategory,
  CustomerStatus,
  LoanStatus,
  LoanRequestStatus,
  InvoiceStatus,
} from "../../../types/api";
import type { WarehouseLocation } from "../../../services/warehouseOperatorService";

// ─── Types ─────────────────────────────────────────────────────────────────

type ReportModule = "customers" | "requests" | "loans" | "invoices" | "inventory" | "team" | "locations" | "orders";

interface DateRange {
  from: string;
  to: string;
}

interface ModuleFilters {
  customers: { status: CustomerStatus | "" };
  requests: { status: LoanRequestStatus | "" };
  loans: { status: LoanStatus | ""; overdue: boolean };
  invoices: { status: InvoiceStatus | ""; type: "rental" | "damage" | "deposit" | "" };
  inventory: { type: "categories" | "types" | "instances" | ""; status: string };
  team: { status: string };
  locations: { status: string };
  orders: { status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "" };
}

interface ReportRow {
  id: string;
  columns: Record<string, string | number>;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Helpers ───────────────────────────────────────────────────────────────

const fmtDate = (iso: string | undefined) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const fmtCurrency = (cents: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cents);

/** Format an ID for display - shows the complete ID */
const fmtId = (id: string | undefined): string => {
  if (!id) return "—";
  return id; // Show complete ID
};

function exportToCSV(headers: string[], rows: ReportRow[], filename: string) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row.columns[h] ?? "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes('"') ? `"${str}"` : str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

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
      customers: { ...MODULE_CONFIG.customers, label: "Clientes", description: "Base de clientes y actividad" },
      requests: { ...MODULE_CONFIG.requests, label: "Solicitudes", description: "Solicitudes y aprobaciones" },
      loans: { ...MODULE_CONFIG.loans, label: "Prestamos", description: "Prestamos activos y completados" },
      invoices: { ...MODULE_CONFIG.invoices, label: "Facturas", description: "Facturacion y pagos" },
      inventory: { ...MODULE_CONFIG.inventory, label: "Inventario", description: "Categorias, tipos e instancias" },
      team: { ...MODULE_CONFIG.team, label: "Equipo", description: "Miembros y roles" },
      locations: { ...MODULE_CONFIG.locations, label: "Ubicaciones", description: "Ubicaciones y capacidad" },
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
  const [teamMembers, setTeamMembers] = useState<Array<{id: string; name: string; email: string; role: string; status: string}>>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

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

          console.log('🔍 Raw API Response - Material Types:', typesRes.data);
          console.log('🔍 Raw API Response - Material Instances:', instancesRes.data);
          console.log('🔍 Raw API Response - Categories:', categoriesRes.data);
          
          const instances = instancesRes.data.instances ?? [];
          const types = typesRes.data.materialTypes ?? [];
          const categories = categoriesRes.data.categories ?? [];
          
          console.log('🔍 Processed instances:', instances);
          console.log('🔍 Processed types:', types);
          console.log('🔍 Processed categories:', categories);
          
          // Log each instance to see its structure
          instances.forEach((instance, index) => {
            console.log(`🔍 Instance ${index}:`, {
              _id: instance._id,
              serialNumber: instance.serialNumber,
              status: instance.status,
              modelId: instance.modelId,
              locationId: instance.locationId
            });
          });

          setMaterialTypes(types);
          setMaterialInstances(instances);
          setCategories(categories);
          
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
                id: u._id ?? u.id ?? "",
                name: `${first} ${last}`.trim() || (u.email ?? ""),
                email: u.email ?? "",
                role: u.roleName ?? "—",
                status: u.status ?? "—",
              };
            })
          );
          break;
        }
        case "locations": {
          try {
            const res = await getLocations({ limit: 100 });
            const locationsData = res.data.items ?? [];
            
            // Mock locations data if no real data
            const mockLocations: WarehouseLocation[] = [
              { 
                _id: "loc1",
                id: "loc1", 
                name: "Main Warehouse", 
                status: "available",
                organizationId: "org1",
                address: { 
                  city: "Bogotá", 
                  department: "Cundinamarca",
                  formatted: "Bogotá, Cundinamarca"
                },
                capacity: 1000,
                occupied: 750,
                isActive: true,
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z"
              },
              { 
                _id: "loc2",
                id: "loc2", 
                name: "Event Storage", 
                status: "available",
                organizationId: "org1",  
                address: { 
                  city: "Medellín", 
                  department: "Antioquia",
                  formatted: "Medellín, Antioquia"
                },
                capacity: 800,
                occupied: 400,
                isActive: true,
                createdAt: "2024-01-02T00:00:00Z",
                updatedAt: "2024-01-02T00:00:00Z"
              },
              { 
                _id: "loc3",
                id: "loc3", 
                name: "Repair Center", 
                status: "maintenance", 
                organizationId: "org1",
                address: { 
                  city: "Cali", 
                  department: "Valle del Cauca",
                  formatted: "Cali, Valle del Cauca"
                },
                capacity: 600,
                occupied: 200,
                isActive: true,
                createdAt: "2024-01-03T00:00:00Z",
                updatedAt: "2024-01-03T00:00:00Z"
              },
              { 
                _id: "loc4",
                id: "loc4", 
                name: "Client Site A", 
                status: "full_capacity",
                organizationId: "org2", 
                address: { 
                  city: "Barranquilla", 
                  department: "Atlántico",
                  formatted: "Barranquilla, Atlántico"
                },
                capacity: 400,
                occupied: 400,
                isActive: true,
                createdAt: "2024-01-04T00:00:00Z",
                updatedAt: "2024-01-04T00:00:00Z"
              }
            ];

            setLocations(locationsData.length > 0 ? locationsData : mockLocations);
          } catch (error) {
            // Fallback to mock data on error
            setLocations([
              { 
                _id: "loc1",
                id: "loc1", 
                name: "Main Warehouse", 
                status: "available",
                organizationId: "org1",
                address: { 
                  city: "Bogotá", 
                  department: "Cundinamarca",
                  formatted: "Bogotá, Cundinamarca"
                },
                capacity: 1000,
                occupied: 750,
                isActive: true,
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z"
              }
            ] as WarehouseLocation[]);
          }
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
        setError(isEs ? "No se pudieron cargar los datos. Intenta de nuevo." : "Failed to load data. Please try again.");
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
              "ID": fmtId(c._id),
              "First Name": c.name.firstName,
              "Last Name": c.name.firstSurname,
              "Email": c.email,
              "Phone": c.phone,
              "Document": `${c.documentType} ${c.documentNumber}`,
              "Status": c.status,
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
              "ID": fmtId(r._id),
              "Customer ID": fmtId(r.customerId),
              "Status": r.status,
              "Start Date": fmtDate(r.startDate),
              "End Date": fmtDate(r.endDate),
              "Items": r.items?.length ? r.items.length.toString() : "—",
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
              "ID": fmtId(l._id),
              "Customer ID": fmtId(l.customerId),
              "Status": l.status,
              "Start Date": fmtDate(l.startDate),
              "End Date": fmtDate(l.endDate),
              "Notes": l.notes ?? "—",
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
              "ID": fmtId(i._id),
              "Customer ID": fmtId(i.customerId),
              "Type": i.type,
              "Status": i.status,
              "Amount (COP)": fmtCurrency(i.amount),
              "Loan ID": i.loanId ? fmtId(i.loanId) : "—",
            },
          })),
        };
      }

      case "inventory": {
        const filterType = filters.inventory.type;
        
        // Helper function to extract category name from different possible formats
        const getCategoryName = (categoryData: any): string => {
          if (!categoryData) return "—";
          
          // If it's an array, take the first element
          if (Array.isArray(categoryData)) {
            const category = categoryData[0];
            return category?.name || category?._id || "—";
          }
          
          // If it's an object with name property
          if (typeof categoryData === "object" && categoryData.name) {
            return categoryData.name;
          }
          
          // If it's an object with _id property
          if (typeof categoryData === "object" && categoryData._id) {
            // Try to find the category name first
            const foundCategory = categories.find(c => c._id === categoryData._id);
            return foundCategory?.name || categoryData._id;
          }
          
          // If it's a string (just the ID)
          if (typeof categoryData === "string") {
            const category = categories.find(c => c._id === categoryData);
            return category?.name || categoryData;
          }
          
          return "—";
        };
        
        if (filterType === "categories") {
          return {
            headers: ["ID", "Name", "Description"],
            rows: categories.map((c) => {
              console.log(`Processing category:`, c);
              return {
                id: c._id,
                columns: {
                  "ID": fmtId(c._id),
                  "Name": c.name,
                  "Description": c.description || "—",
                },
              };
            }),
          };
        } else if (filterType === "types") {
          console.log('Processing material types:', materialTypes);
          console.log('Available categories for lookup:', categories);
          return {
            headers: ["ID", "Name", "Category", "Price/Day", "Description"],
            rows: materialTypes.map((mt) => {
              const categoryName = getCategoryName(mt.categoryId);
              console.log(`Type ${mt.name} - categoryId:`, mt.categoryId, '- resolved to:', categoryName);
              return {
                id: mt._id,
                columns: {
                  "ID": fmtId(mt._id),
                  "Name": mt.name,
                  "Category": categoryName,
                  "Price/Day": fmtCurrency(mt.pricePerDay ?? 0),
                  "Description": mt.description || "—",
                },
              };
            }),
          };
        } else {
          // Show instances by default (when filterType is "instances" or "")
          const filtered = materialInstances.filter((m) => {
            if (filters.inventory.status && m.status !== filters.inventory.status) return false;
            return true;
          });
          
          console.log('🔍 Filtered instances for table:', filtered);
          
          return {
            headers: ["Serial", "Model", "Status", "Location", "Price/Day", "Description"],
            rows: filtered.map((m) => {
              console.log('🔍 Processing instance for table:', m);
              console.log('🔍 Instance fields:', {
                serialNumber: m.serialNumber,
                modelId: m.modelId,
                status: m.status,
                locationId: m.locationId
              });
              
              const row = {
                id: m._id,
                columns: {
                  "Serial": m.serialNumber || "—",
                  "Model": m.modelId?.name || "—",
                  "Status": m.status || "—",
                  "Location": m.locationId?.name || "—",
                  "Price/Day": m.modelId?.pricePerDay ? fmtCurrency(m.modelId.pricePerDay) : "—",
                  "Description": m.modelId?.description || "—",
                },
              };
              
              console.log('🔍 Generated row:', row);
              return row;
            }),
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
              "ID": fmtId(u.id),
              "Name": u.name,
              "Email": u.email,
              "Role": u.role,
              "Status": u.status,
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
              "ID": fmtId(l._id),
              "Name": l.name,
              "Organization": fmtId(l.organizationId) || "—",
              "Status": l.status,
              "City": l.address?.city || "—",
              "Department": l.address?.department || "—",
              "Address": `${l.address?.streetType || ""} ${l.address?.primaryNumber || ""}`.trim() || "—",
            },
          })),
        };
      }

      case "orders": {
        const filtered = orders.filter((o: any) => {
          if (filters.orders.status && o.status !== filters.orders.status) return false;
          return matchesDate(o.date);
        });
        return {
          headers: ["Order ID", "Customer", "Date", "Items", "Total", "Status", "Rental Start", "Rental End"],
          rows: filtered.map((o: any) => ({
            id: o.id,
            columns: {
              "Order ID": o.orderId,
              "Customer": o.customer,
              "Date": fmtDate(o.date),
              "Items": o.items.toString(),
              "Total": fmtCurrency(o.total),
              "Status": o.status,
              "Rental Start": fmtDate(o.rentalStart),
              "Rental End": fmtDate(o.rentalEnd),
            },
          })),
        };
      }

      default:
        return { headers: [], rows: [] };
    }
  }, [activeModule, customers, requests, loans, invoices, materialTypes, materialInstances, teamMembers, locations, categories, orders, filters, dateRange]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ─── KPI Cards ─────────────────────────────────────────────────────────

  const kpiCards: Array<{ label: string; value: string | number; icon: React.ReactNode; trend?: string; trendUp?: boolean }> = useMemo(() => {
    switch (activeModule) {
      case "customers":
        return [
          { label: "Total", value: customers.length, icon: <Users size={24} /> },
          { label: "Active", value: customers.filter((c) => c.status === "active").length, icon: <Users size={24} />, trend: "active", trendUp: true },
          { label: "Inactive", value: customers.filter((c) => c.status === "inactive").length, icon: <Users size={24} /> },
          { label: "Blacklisted", value: customers.filter((c) => c.status === "blacklisted").length, icon: <Users size={24} /> },
        ];
      case "requests":
        return [
          { label: "Total", value: requests.length, icon: <ClipboardList size={24} /> },
          { label: "Pending", value: requests.filter((r) => r.status === "pending").length, icon: <ClipboardList size={24} /> },
          { label: "Approved", value: requests.filter((r) => r.status === "approved").length, icon: <ClipboardList size={24} />, trend: "approved", trendUp: true },
          { label: "Rejected", value: requests.filter((r) => r.status === "rejected").length, icon: <ClipboardList size={24} /> },
        ];
      case "loans":
        return [
          { label: "Total", value: loans.length, icon: <TrendingUp size={24} /> },
          { label: "Active", value: loans.filter((l) => l.status === "active").length, icon: <TrendingUp size={24} />, trendUp: true },
          { label: "Overdue", value: loans.filter((l) => l.status === "overdue").length, icon: <TrendingUp size={24} /> },
          { label: "Returned", value: loans.filter((l) => l.status === "returned").length, icon: <TrendingUp size={24} /> },
        ];
      case "invoices":
        return [
          { label: "Total Invoices", value: invoices.length, icon: <FileText size={24} /> },
          { label: "Pending", value: invoiceSummary?.pending.count ?? invoices.filter((i) => i.status === "pending").length, icon: <DollarSign size={24} /> },
          { label: "Paid", value: invoiceSummary?.paid.count ?? invoices.filter((i) => i.status === "paid").length, icon: <DollarSign size={24} />, trendUp: true },
          {
            label: "Total Amount",
            value: fmtCurrency(invoices.reduce((sum, i) => sum + (i.amount ?? 0), 0)),
            icon: <DollarSign size={24} />,
          },
        ];
      case "inventory":
        return [
          { label: "Types (Catalog)", value: materialTypes.length, icon: <Boxes size={24} /> },
          { label: "Total Units", value: materialInstances.length, icon: <Boxes size={24} /> },
          { label: "Available", value: materialInstances.filter((m) => m.status === "available").length, icon: <Boxes size={24} />, trendUp: true },
          { label: "Loaned / In Use", value: materialInstances.filter((m) => ["loaned", "in_use"].includes(m.status)).length, icon: <Boxes size={24} /> },
        ];
      case "team":
        return [
          { label: "Total Members", value: teamMembers.length, icon: <Users size={24} /> },
          { label: "Active", value: teamMembers.filter((u) => u.status === "active").length, icon: <Users size={24} />, trendUp: true },
          { label: "Invited", value: teamMembers.filter((u) => u.status === "invited").length, icon: <Users size={24} /> },
          { label: "Roles", value: new Set(teamMembers.map((u) => u.role)).size, icon: <Package size={24} /> },
        ];
      case "locations":
        return [
          { label: "Total Locations", value: locations.length, icon: <Boxes size={24} /> },
          { label: "Available", value: locations.filter((l) => l.status === "available").length, icon: <Boxes size={24} />, trendUp: true },
          { label: "Full Capacity", value: locations.filter((l) => l.status === "full_capacity").length, icon: <Boxes size={24} /> },
          { label: "Maintenance", value: locations.filter((l) => l.status === "maintenance").length, icon: <Boxes size={24} /> },
        ];
      case "inventory":
        const filterType = filters.inventory.type;
        if (filterType === "categories") {
          return [
            { label: "Total Categories", value: categories.length, icon: <Package size={24} /> },
            { label: "Material Types", value: materialTypes.length, icon: <Package size={24} /> },
            { label: "Instances", value: materialInstances.length, icon: <Package size={24} /> },
            { label: "With Parent", value: categories.filter((c) => c.parentId).length, icon: <Package size={24} /> },
          ];
        } else if (filterType === "types") {
          return [
            { label: "Total Types", value: materialTypes.length, icon: <Package size={24} /> },
            { label: "Categories", value: categories.length, icon: <Package size={24} /> },
            { label: "Instances", value: materialInstances.length, icon: <Package size={24} /> },
            { label: "Avg Price/Day", value: fmtCurrency(materialTypes.reduce((sum, mt) => sum + (mt.pricePerDay || 0), 0) / (materialTypes.length || 1)), icon: <Package size={24} /> },
          ];
        } else {
          // Default: instances view
          return [
            { label: "Total Instances", value: materialInstances.length, icon: <Package size={24} /> },
            { label: "Available", value: materialInstances.filter((mi) => mi.status === "available").length, icon: <Package size={24} />, trendUp: true },
            { label: "Loaned", value: materialInstances.filter((mi) => mi.status === "loaned").length, icon: <Package size={24} /> },
            { label: "Maintenance", value: materialInstances.filter((mi) => mi.status === "maintenance").length, icon: <Package size={24} /> },
          ];
        }
      case "orders":
        return [
          { label: "Total Orders", value: orders.length, icon: <ShoppingCart size={24} /> },
          { label: "Pending", value: orders.filter((o: any) => o.status === "pending").length, icon: <ShoppingCart size={24} /> },
          { label: "Completed", value: orders.filter((o: any) => o.status === "completed").length, icon: <ShoppingCart size={24} />, trendUp: true },
          { label: "Revenue", value: fmtCurrency(orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)), icon: <DollarSign size={24} /> },
        ];
      default:
        return [];
    }
  }, [activeModule, customers, requests, loans, invoices, materialTypes, materialInstances, teamMembers, locations, categories, orders, invoiceSummary]);

  // ─── Status badge ──────────────────────────────────────────────────────

  const statusBadgeClass = (val: string) => {
    switch (val) {
      case "active": case "paid": case "approved": case "available": case "returned":
        return "bg-emerald-900/60 text-emerald-300";
      case "inactive": case "cancelled": case "rejected": case "retired":
        return "bg-red-900/60 text-red-300";
      case "pending": case "invited": case "reserved":
        return "bg-yellow-900/60 text-yellow-300";
      case "overdue": case "damaged": case "lost":
        return "bg-orange-900/60 text-orange-300";
      case "blacklisted":
        return "bg-purple-900/60 text-purple-300";
      case "maintenance":
        return "bg-blue-900/60 text-blue-300";
      default:
        return "bg-zinc-700 text-zinc-300";
    }
  };

  const STATUS_COLUMNS = new Set(["Status", "status"]);

  // ─── Filter panel ──────────────────────────────────────────────────────

  const handleModuleChange = (mod: ReportModule) => {
    setActiveModule(mod);
    setPage(1);
  };

  const setFilter = <M extends ReportModule>(mod: M, key: keyof ModuleFilters[M], value: ModuleFilters[M][keyof ModuleFilters[M]]) => {
    setFilters((prev) => ({ ...prev, [mod]: { ...prev[mod], [key]: value } }));
    setPage(1);
  };

  const handleExport = () => {
    const filename = `report_${activeModule}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCSV(headers, rows, filename);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{isEs ? "Reportes y analitica" : "Reports & Analytics"}</h1>
          <p className="text-gray-400 mt-1">{isEs ? "Explora datos en todos los modulos" : "Explore data across all modules"}</p>
        </div>
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
      </div>

      {/* Module Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(moduleConfig) as [ReportModule, typeof moduleConfig[ReportModule]][]).map(
          ([mod, cfg]) => (
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
          )
        )}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <StatCard key={i} label={card.label} value={card.value} icon={card.icon} trend={card.trend} trendUp={card.trendUp} />
        ))}
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-yellow-400" />
          <span className="text-sm font-semibold text-gray-300">{isEs ? "Filtros" : "Filters"}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isEs ? "Desde" : "From"}</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => { setDateRange((p) => ({ ...p, from: e.target.value })); setPage(1); }}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
            />
          </div>
          {/* Date To */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isEs ? "Hasta" : "To"}</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => { setDateRange((p) => ({ ...p, to: e.target.value })); setPage(1); }}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
            />
          </div>

          {/* Module-specific filters */}
          {activeModule === "customers" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.customers.status}
                onChange={(e) => setFilter("customers", "status", e.target.value as CustomerStatus | "")}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          )}

          {activeModule === "requests" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.requests.status}
                onChange={(e) => setFilter("requests", "status", e.target.value as LoanRequestStatus | "")}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="ready">Ready</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {activeModule === "loans" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select
                  value={filters.loans.status}
                  onChange={(e) => setFilter("loans", "status", e.target.value as LoanStatus | "")}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="returned">Returned</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.loans.overdue}
                    onChange={(e) => setFilter("loans", "overdue", e.target.checked)}
                    className="w-4 h-4 text-yellow-400 bg-zinc-800 border-zinc-700 rounded"
                  />
                  Only overdue
                </label>
              </div>
            </>
          )}

          {activeModule === "invoices" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select
                  value={filters.invoices.status}
                  onChange={(e) => setFilter("invoices", "status", e.target.value as InvoiceStatus | "")}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select
                  value={filters.invoices.type}
                  onChange={(e) => setFilter("invoices", "type", e.target.value as "rental" | "damage" | "deposit" | "")}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
                >
                  <option value="">All</option>
                  <option value="rental">Rental</option>
                  <option value="damage">Damage</option>
                  <option value="deposit">Deposit</option>
                </select>
              </div>
            </>
          )}

          {activeModule === "inventory" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Instance Status</label>
              <select
                value={filters.inventory.status}
                onChange={(e) => setFilter("inventory", "status", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="loaned">Loaned</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="damaged">Damaged</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          )}

          {activeModule === "team" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.team.status}
                onChange={(e) => setFilter("team", "status", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="invited">Invited</option>
              </select>
            </div>
          )}

          {activeModule === "locations" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.locations.status}
                onChange={(e) => setFilter("locations", "status", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="full_capacity">Full Capacity</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          {activeModule === "inventory" && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">View Type</label>
                <select
                  value={filters.inventory.type}
                  onChange={(e) => setFilter("inventory", "type", e.target.value as "types" | "categories" | "instances" | "")}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
                >
                  <option value="">Material Instances (Default)</option>
                  <option value="instances">Material Instances</option>
                  <option value="types">Material Types</option>
                  <option value="categories">Categories</option>
                </select>
              </div>
              {(filters.inventory.type === "" || filters.inventory.type === "instances") && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Instance Status</label>
                  <select
                    value={filters.inventory.status}
                    onChange={(e) => setFilter("inventory", "status", e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
                  >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="loaned">Loaned</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="damaged">Damaged</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              )}
            </>
          )}



          {activeModule === "orders" && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Order Status</label>
              <select
                value={filters.orders.status}
                onChange={(e) => setFilter("orders", "status", e.target.value as "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "")}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}



          {/* Clear filters */}
          {(dateRange.from || dateRange.to) && (
            <div className="flex items-end">
              <button
                onClick={() => { setDateRange({ from: "", to: "" }); setPage(1); }}
                className="text-xs text-yellow-400 hover:text-yellow-300 transition underline"
              >
                {isEs ? "Limpiar fechas" : "Clear dates"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-semibold">
              {moduleConfig[activeModule].label} {isEs ? "- Reporte" : "Report"}
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {loading ? (isEs ? "Cargando..." : "Loading…") : isEs ? `${rows.length} registros encontrados` : `${rows.length} records found`}
            </p>
          </div>
        </div>

        {error && (
          <div className="m-4 p-4 bg-red-900/20 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-yellow-400" />
            {isEs ? "Cargando datos..." : "Loading data…"}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            {isEs ? "No hay registros para esta combinacion de filtros." : "No records for this filter combination."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/60 border-b border-zinc-700">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition">
                    {headers.map((h) => {
                      const val = row.columns[h] ?? "—";
                      const isStatus = STATUS_COLUMNS.has(h);
                      return (
                        <td key={h} className="px-5 py-3 text-gray-300 whitespace-nowrap">
                          {isStatus ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(String(val))}`}>
                              {String(val)}
                            </span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
            <span className="text-xs text-gray-400">
              {isEs
                ? `Mostrando ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, rows.length)} de ${rows.length}`
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 6, page - 3)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                      p === page
                        ? "bg-yellow-400 text-black"
                        : "text-gray-400 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}