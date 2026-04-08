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
  TransferStatus,
  ReportsLoansData,
  ReportsInventoryData,
  ReportsFinancialData,
  ReportsDamagesData,
  ReportsTransfersData,
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
  TransferStatus,
  ReportsLoansData,
  ReportsInventoryData,
  ReportsFinancialData,
  ReportsDamagesData,
  ReportsTransfersData,
};

export type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
export type { Order } from "../../../../services/commercialAdvisorService";

export type ReportModule =
  | "customers"
  | "requests"
  | "loans"
  | "financial"
  | "inventory"
  | "team"
  | "locations"
  | "orders"
  | "damages"
  | "transfers";

export interface DateRange {
  from: string;
  to: string;
}

export interface ModuleFilters {
  customers: { status: CustomerStatus | "" };
  requests: { status: LoanRequestStatus | "" };
  loans: { status: LoanStatus | ""; overdue: boolean };
  financial: {
    status: InvoiceStatus | "";
    type: "rental" | "damage" | "deposit" | "deposit_shortfall" | "";
  };
  inventory: { type: "categories" | "types" | "instances" | ""; status: string };
  team: { status: string };
  locations: { status: string };
  orders: { status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "" };
  damages: { status: string };
  transfers: { status: TransferStatus | "" };
}

export interface ReportRow {
  id: string;
  columns: Record<string, string | number>;
}

export interface KpiCard {
  label: string;
  value: string | number;
  color?: string;
}

/** KPI card data for the reports dashboard */
export interface KpiCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}
