import type { LoanRequest, Loan } from "../../../../types/api";
import { getWorkflowStatusLabel } from "../../../../utils/statusLabels";

export type WorkflowStatus =
  | "order_created"
  | "order_deposit_pending"
  | "order_approved"
  | "order_assigned"
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

export const WORKFLOW_STEPS: Array<{ status: WorkflowStatus; labelEn: string; labelEs: string }> = [
  { status: "order_created", labelEn: "Order Created", labelEs: "Pedido creado" },
  { status: "order_deposit_pending", labelEn: "Deposit Pending", labelEs: "Depósito pendiente" },
  { status: "order_approved", labelEn: "Order Approved", labelEs: "Pedido aprobado" },
  { status: "order_assigned", labelEn: "Materials Assigned", labelEs: "Materiales asignados" },
  { status: "order_shipped", labelEn: "Ready for Checkout", labelEs: "Listo para despacho" },
  { status: "order_in_use", labelEn: "Order In Use / Loaned", labelEs: "Pedido en uso / prestado" },
  {
    status: "order_completed",
    labelEn: "Order Completed / Delivered",
    labelEs: "Pedido completado / entregado",
  },
];

export function getFilterOptions(
  language: "en" | "es",
): Array<{ value: WorkflowFilter; label: string }> {
  const allLabel = language === "es" ? "Todos los estados" : "All Status";
  return [
    { value: "all", label: allLabel },
    { value: "order_created", label: getWorkflowStatusLabel("order_created", language) },
    {
      value: "order_deposit_pending",
      label: getWorkflowStatusLabel("order_deposit_pending", language),
    },
    { value: "order_approved", label: getWorkflowStatusLabel("order_approved", language) },
    { value: "order_assigned", label: getWorkflowStatusLabel("order_assigned", language) },
    { value: "order_shipped", label: getWorkflowStatusLabel("order_shipped", language) },
    { value: "order_in_use", label: getWorkflowStatusLabel("order_in_use", language) },
    { value: "order_completed", label: getWorkflowStatusLabel("order_completed", language) },
    { value: "order_rejected", label: getWorkflowStatusLabel("order_rejected", language) },
    { value: "order_cancelled", label: getWorkflowStatusLabel("order_cancelled", language) },
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
