import type { LoanRequest, Loan } from "../../../../types/api";

export type WorkflowStatus =
  | "order_created"
  | "order_deposit_pending"
  | "order_approved"
  | "order_shipped"
  | "order_in_use"
  | "order_completed"
  | "order_rejected"
  | "order_cancelled";

export type WorkflowFilter = "all" | WorkflowStatus;

export type BackendRequestStatusFilter = LoanRequest["status"] | undefined;

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

export type OrderView = {
  request: LoanRequest;
  loan?: Loan;
  workflowStatus: WorkflowStatus;
  workflowLabel: string;
  customerName: string;
  itemCount: number;
  displayItems: string[];
};

export type MaterialAvailability = {
  total: number;
  available: number;
};

export const WORKFLOW_STEPS: Array<{ status: WorkflowStatus; label: string }> = [
  { status: "order_created", label: "Order Created" },
  { status: "order_deposit_pending", label: "Deposit Pending" },
  { status: "order_approved", label: "Order Approved" },
  { status: "order_shipped", label: "Order Shipped" },
  { status: "order_in_use", label: "Order In Use / Loaned" },
  { status: "order_completed", label: "Order Completed / Delivered" },
];

export function getFilterOptions(
  isEs: boolean,
): Array<{ value: WorkflowFilter; label: string }> {
  return [
    { value: "all", label: isEs ? "Todos los estados" : "All Status" },
    { value: "order_created", label: isEs ? "Pedido creado" : "Order Created" },
    {
      value: "order_deposit_pending",
      label: isEs ? "Deposito pendiente" : "Deposit Pending",
    },
    { value: "order_approved", label: isEs ? "Pedido aprobado" : "Order Approved" },
    { value: "order_shipped", label: isEs ? "Pedido despachado" : "Order Shipped" },
    {
      value: "order_in_use",
      label: isEs ? "Pedido en uso / prestado" : "Order In Use / Loaned",
    },
    {
      value: "order_completed",
      label: isEs ? "Pedido completado / entregado" : "Order Completed / Delivered",
    },
    { value: "order_rejected", label: isEs ? "Rechazado" : "Rejected" },
    { value: "order_cancelled", label: isEs ? "Cancelado" : "Cancelled" },
  ];
}

export const EMPTY_FORM = {
  customerId: "",
  startDate: "",
  endDate: "",
  depositDueDate: "",
  depositAmount: "" as string | number,
  notes: "",
};

export const RECENT_ORDER_MATERIALS_KEY = "orders.recentMaterialIds";
export const ORDER_MATERIAL_USAGE_KEY = "orders.materialUsageCounts";
export const LOW_STOCK_THRESHOLD = 2;
