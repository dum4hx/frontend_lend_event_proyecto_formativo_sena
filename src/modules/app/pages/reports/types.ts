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
  ExportLoanActivityData,
  ExportSalesData,
  ExportInventoryData,
  ExportDamagesData,
  ExportTransfersData,
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
  ExportLoanActivityData,
  ExportSalesData,
  ExportInventoryData,
  ExportDamagesData,
  ExportTransfersData,
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
  loans: { status: LoanStatus | ""; overdue: boolean; customerId: string; locationId: string };
  financial: {
    status: InvoiceStatus | "";
    type: "rental" | "damage" | "deposit" | "deposit_shortfall" | "";
    customerId: string;
    locationId: string;
    categoryId: string;
    invoiceType: string;
    invoiceStatus: string;
  };
  inventory: {
    type: "categories" | "types" | "instances" | "";
    status: string;
    locationId: string;
    categoryId: string;
    search: string;
  };
  team: { status: string };
  locations: { status: string };
  orders: { status: "pending" | "confirmed" | "in-progress" | "completed" | "cancelled" | "" };
  damages: { status: string; locationId: string; batchStatus: string; entryReason: string };
  transfers: { status: TransferStatus | ""; fromLocationId: string; toLocationId: string };
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
