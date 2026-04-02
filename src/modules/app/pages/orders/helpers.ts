import type {
  Customer,
  Loan,
  LoanRequest,
  LoanRequestItem,
  MaterialInstance,
  MaterialType,
  Package,
  PackageMaterialEntry,
} from "../../../../types/api";
import type {
  WorkflowStatus,
  WorkflowFilter,
  BackendRequestStatusFilter,
  OrderView,
} from "./types";
import { WORKFLOW_STEPS } from "./types";

export function formatDate(dateValue: string): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleString();
}

export function formatCustomerName(customer: Customer): string {
  return `${customer.name.firstName} ${customer.name.firstSurname}`.trim();
}

export function getTodayLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayLocalDatetimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function toSafeStartDateIso(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";
  if (dateTimeLocal.includes("Z")) return dateTimeLocal;

  if (dateTimeLocal.length === 10 && !dateTimeLocal.includes("T")) {
    const today = getTodayLocalDateString();
    if (dateTimeLocal === today) {
      const nearFuture = new Date(Date.now() + 5 * 60 * 1000);
      return nearFuture.toISOString();
    }
    return new Date(`${dateTimeLocal}T09:00:00`).toISOString();
  }

  const date = new Date(dateTimeLocal);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function toSafeEndDateIso(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";
  if (dateTimeLocal.includes("Z")) return dateTimeLocal;

  if (dateTimeLocal.length === 10 && !dateTimeLocal.includes("T")) {
    return new Date(`${dateTimeLocal}T23:59:59`).toISOString();
  }

  const date = new Date(dateTimeLocal);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function formatMoney(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getMaterialSearchScore(material: MaterialType, normalizedQuery: string): number {
  if (!normalizedQuery) return 1;

  const normalizedName = normalizeSearchText(material.name);
  const normalizedDescription = normalizeSearchText(material.description);

  if (normalizedName.startsWith(normalizedQuery)) return 5;
  if (normalizedName.includes(normalizedQuery)) return 4;
  if (normalizedDescription.startsWith(normalizedQuery)) return 3;
  if (normalizedDescription.includes(normalizedQuery)) return 2;

  return 0;
}

export function extractCategoryId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return (first as { _id?: string })._id;
  }
  if (value && typeof value === "object") return (value as { _id?: string })._id;
  return undefined;
}

export function extractMaterialTypeIdFromInstance(instance: MaterialInstance): string | undefined {
  const withModel = instance as MaterialInstance & {
    model?: { _id?: string } | string;
    modelId?: { _id?: string } | string;
    materialTypeId?: string;
  };

  if (typeof withModel.model === "string") return withModel.model;
  if (withModel.model && typeof withModel.model === "object" && withModel.model._id) {
    return withModel.model._id;
  }
  if (typeof withModel.modelId === "string") return withModel.modelId;
  if (withModel.modelId && typeof withModel.modelId === "object" && withModel.modelId._id) {
    return withModel.modelId._id;
  }
  if (withModel.materialTypeId) return withModel.materialTypeId;
  return undefined;
}

export function extractMaterialTypeIdFromPackageEntry(
  entry: PackageMaterialEntry,
): string | undefined {
  const candidate = (entry as PackageMaterialEntry & { materialTypeId: unknown }).materialTypeId;
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") {
    return (candidate as { _id?: string })._id;
  }
  return undefined;
}

export function getWorkflowFromRequestAndLoan(
  request: LoanRequest,
  loan?: Loan,
): { status: WorkflowStatus; label: string } {
  if (request.status === "rejected") {
    return { status: "order_rejected", label: "Rejected" };
  }
  if (request.status === "cancelled") {
    return { status: "order_cancelled", label: "Cancelled" };
  }
  if (request.status === "expired") {
    return { status: "order_cancelled", label: "Expired" };
  }

  if (loan) {
    if (loan.status === "returned" || loan.status === "closed") {
      return { status: "order_completed", label: "Order Completed / Delivered" };
    }
    if (loan.status === "active" || loan.status === "overdue") {
      return { status: "order_in_use", label: "Order In Use / Loaned" };
    }
  }

  if (request.status === "completed") {
    return { status: "order_completed", label: "Order Completed / Delivered" };
  }
  if (request.status === "shipped") {
    return { status: "order_in_use", label: "Order In Use / Loaned" };
  }
  if (request.status === "ready") {
    return { status: "order_shipped", label: "Ready for Checkout" };
  }
  if (request.status === "assigned") {
    return { status: "order_assigned", label: "Materials Assigned" };
  }
  if (request.status === "deposit_pending") {
    return { status: "order_deposit_pending", label: "Deposit Pending" };
  }
  if (request.status === "approved") {
    return { status: "order_approved", label: "Order Approved" };
  }

  return { status: "order_created", label: "Order Created" };
}

export function getStatusBadgeStyle(status: WorkflowStatus): string {
  switch (status) {
    case "order_completed":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "order_in_use":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "order_shipped":
      return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
    case "order_assigned":
      return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30";
    case "order_approved":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "order_deposit_pending":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    case "order_created":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "order_rejected":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "order_cancelled":
      return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

export function getStepIndex(status: WorkflowStatus): number {
  if (status === "order_rejected" || status === "order_cancelled") return 0;
  return WORKFLOW_STEPS.findIndex((step) => step.status === status);
}

export function findRelatedLoan(requestId: string, loans: Loan[]): Loan | undefined {
  return loans.find((loan) => loan.requestId === requestId);
}

export function extractCustomerIdFromRequest(request: LoanRequest): string | undefined {
  if (typeof request.customerId === "string") return request.customerId;

  const candidate = request.customerId as unknown;
  if (candidate && typeof candidate === "object") {
    return (candidate as { _id?: string })._id;
  }

  return undefined;
}

export function mapRequestItemsToDisplay(
  items: LoanRequestItem[],
  packages: Package[],
  materialTypes: MaterialType[],
): string[] {
  return items.map((item) => {
    const quantity = item.quantity ?? 1;
    const packageRefId = item.packageId ?? (item.type === "package" ? item.referenceId : undefined);
    const materialRefId =
      item.materialTypeId ?? (item.type === "material" ? item.referenceId : undefined);

    if (packageRefId) {
      const packageName = packages.find((pkg) => pkg._id === packageRefId)?.name;
      return `${quantity}x ${packageName ?? "Package"} (Service Package)`;
    }

    if (materialRefId) {
      const materialName = materialTypes.find((material) => material._id === materialRefId)?.name;
      return `${quantity}x ${materialName ?? "Material"}`;
    }

    return `${quantity}x Unspecified item`;
  });
}

export function buildOrderViewModel(
  requests: LoanRequest[],
  loans: Loan[],
  customers: Customer[],
  packages: Package[],
  materialTypes: MaterialType[],
): OrderView[] {
  return requests.map((request) => {
    const relatedLoan = findRelatedLoan(request._id, loans);
    const workflow = getWorkflowFromRequestAndLoan(request, relatedLoan);
    const customerId = extractCustomerIdFromRequest(request);
    const customer = customerId ? customers.find((entry) => entry._id === customerId) : undefined;

    return {
      request,
      loan: relatedLoan,
      workflowStatus: workflow.status,
      workflowLabel: workflow.label,
      customerName: customer ? formatCustomerName(customer) : "Unknown customer",
      itemCount: request.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      displayItems: mapRequestItemsToDisplay(request.items, packages, materialTypes),
    };
  });
}

export function toBackendRequestStatusFilter(
  selectedStatus: WorkflowFilter,
): BackendRequestStatusFilter {
  if (selectedStatus === "all") return undefined;
  if (selectedStatus === "order_created") return "pending";
  if (selectedStatus === "order_deposit_pending") return "deposit_pending";
  if (selectedStatus === "order_approved") return "approved";
  if (selectedStatus === "order_assigned") return "assigned";
  if (selectedStatus === "order_shipped") return "ready";
  if (selectedStatus === "order_in_use") return "shipped";
  if (selectedStatus === "order_completed") return "completed";
  if (selectedStatus === "order_rejected") return "rejected";
  if (selectedStatus === "order_cancelled") return "cancelled";
  return undefined;
}
