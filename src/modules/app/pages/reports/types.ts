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
} from "../../../../types/api";

export type {
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
};

export type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
export type { Order } from "../../../../services/commercialAdvisorService";

export type ReportModule =
  | "customers"
  | "requests"
  | "loans"
  | "invoices"
  | "inventory"
  | "team"
  | "locations"
  | "orders";

export interface DateRange {
  from: string;
  to: string;
}

export interface ModuleFilters {
  customers: { status: CustomerStatus | "" };
  requests: { status: LoanRequestStatus | "" };
  loans: { status: LoanStatus | ""; overdue: boolean };
  invoices: { status: InvoiceStatus | ""; type: "rental" | "damage" | "deposit" | "" };
  inventory: { type: "categories" | "types" | "instances" | ""; status: string };
  team: { status: string };
  locations: { status: string };
  orders: { status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "" };
}

export interface ReportRow {
  id: string;
  columns: Record<string, string | number>;
}

/** KPI card data for the reports dashboard */
export interface KpiCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}
