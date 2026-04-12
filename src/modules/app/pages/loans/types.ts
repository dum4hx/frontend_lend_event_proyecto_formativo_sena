import type { LoanRequest, Loan, LoanRequestStatus, LoanStatus } from "../../../../types/api";

// ─── Unified Status ────────────────────────────────────────────────────────

/** All possible unified statuses combining LoanRequest + Loan lifecycle. */
export type UnifiedLoanStatus =
  | "pending"
  | "approved"
  | "assigned"
  | "ready"
  | "active"
  | "overdue"
  | "returned"
  | "inspected"
  | "closed"
  | "rejected"
  | "cancelled"
  | "expired";

/** Filter tab grouping. */
export type LoanFilterTab = "all" | "request" | "active_loan" | "completed";

/** Sub-filter options per tab. */
export type LoanSubFilter = "all" | UnifiedLoanStatus;

// ─── View Model ────────────────────────────────────────────────────────────

export interface UnifiedLoanView {
  request: LoanRequest;
  loan?: Loan;
  status: UnifiedLoanStatus;
  statusLabel: string;
  customerName: string;
  itemCount: number;
  displayItems: string[];
}

// ─── Workflow Steps ────────────────────────────────────────────────────────

export interface WorkflowStepDef {
  status: UnifiedLoanStatus;
  labelEn: string;
  labelEs: string;
}

export const UNIFIED_WORKFLOW_STEPS: WorkflowStepDef[] = [
  { status: "pending", labelEn: "Request Created", labelEs: "Petición Por Confirmar" },
  { status: "approved", labelEn: "Approved", labelEs: "Confirmado" },
  { status: "ready", labelEn: "Ready for Checkout", labelEs: "Bodega Preparando" },
  { status: "active", labelEn: "Active (In Use)", labelEs: "Activo (En Uso)" },
  { status: "overdue", labelEn: "Overdue", labelEs: "Vencido" },
  { status: "returned", labelEn: "Returned", labelEs: "Devuelto" },
  { status: "inspected", labelEn: "Inspected", labelEs: "Inspeccionado" },
  { status: "closed", labelEn: "Loan Closed", labelEs: "Préstamo Cerrado" },
];

export const TERMINAL_STATUSES: WorkflowStepDef[] = [
  { status: "rejected", labelEn: "Rejected", labelEs: "Rechazada" },
  { status: "cancelled", labelEn: "Cancelled", labelEs: "Cancelada" },
  { status: "expired", labelEn: "Expired", labelEs: "Expirada" },
];

// ─── Filter Options ────────────────────────────────────────────────────────

/** Sub-states available under each tab. */
export const TAB_SUB_FILTERS: Record<LoanFilterTab, UnifiedLoanStatus[]> = {
  all: [
    "pending",
    "approved",
    "ready",
    "rejected",
    "cancelled",
    "expired",
    "active",
    "overdue",
    "returned",
    "inspected",
    "closed",
  ],
  request: ["pending", "approved", "ready", "rejected", "cancelled", "expired"],
  active_loan: ["active", "overdue"],
  completed: ["returned", "inspected", "closed"],
};

// ─── Backend filter mapping types ──────────────────────────────────────────

export interface BackendFilterParams {
  requestStatus?: LoanRequestStatus;
  loanStatus?: LoanStatus;
}

// ─── Validation error types (reused from CreateOrderModal) ─────────────────

export type DraftItemValidationErrors = {
  categoryId?: string;
  materialTypeId?: string;
  quantity?: string;
};

export type CreateOrderValidationErrors = {
  customerId?: string;
  startDate?: string;
  endDate?: string;
  depositDueDate?: string;
  depositAmount?: string;
  items?: string;
  rows: Record<string, DraftItemValidationErrors>;
};

export const EMPTY_FORM = {
  customerId: "",
  startDate: "",
  endDate: "",
  depositDueDate: "",
  depositAmount: "" as string | number,
  notes: "",
};

export const RECENT_ORDER_MATERIALS_KEY = "loans.recentMaterialIds";
export const ORDER_MATERIAL_USAGE_KEY = "loans.materialUsageCounts";
export const LOW_STOCK_THRESHOLD = 2;
