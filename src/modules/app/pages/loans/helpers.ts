import type {
  Customer,
  Loan,
  LoanRequest,
  LoanRequestItem,
  MaterialType,
  Package,
  PopulatedUserRef,
} from "../../../../types/api";
import type { UnifiedLoanStatus, UnifiedLoanView, LoanFilterTab, LoanSubFilter } from "./types";
import { UNIFIED_WORKFLOW_STEPS } from "./types";

// ─── Status derivation ─────────────────────────────────────────────────────

export function getUnifiedStatus(request: LoanRequest, loan?: Loan): UnifiedLoanStatus {
  if (request.status === "rejected") return "rejected";
  if (request.status === "cancelled") return "cancelled";
  if (request.status === "expired") return "expired";

  if (loan) {
    if (loan.status === "closed") return "closed";
    if (loan.status === "inspected") return "inspected";
    if (loan.status === "returned") return "returned";
    if (loan.status === "overdue") return "overdue";
    if (loan.status === "active") return "active";
  }

  if (request.status === "completed") return "closed";
  if (request.status === "shipped") return "active";
  if (request.status === "ready") return "ready";
  if (request.status === "assigned") return "assigned";
  if (request.status === "approved" || request.status === "deposit_pending") return "approved";

  return "pending";
}

// ─── Status label ───────────────────────────────────────────────────────────

export function getUnifiedStatusLabel(status: UnifiedLoanStatus, language: "en" | "es"): string {
  const step = UNIFIED_WORKFLOW_STEPS.find((s) => s.status === status);
  if (step) return language === "es" ? step.labelEs : step.labelEn;

  const terminalLabels: Record<string, { en: string; es: string }> = {
    rejected: { en: "Rejected", es: "Rechazada" },
    cancelled: { en: "Cancelled", es: "Cancelada" },
    expired: { en: "Expired", es: "Expirada" },
  };
  return terminalLabels[status]?.[language] ?? status;
}

// ─── Badge styles ───────────────────────────────────────────────────────────

export function getUnifiedStatusBadgeStyle(status: UnifiedLoanStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "approved":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "assigned":
      return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30";
    case "ready":
      return "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
    case "active":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "overdue":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "returned":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "inspected":
      return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
    case "closed":
      return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30";
    case "rejected":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "cancelled":
      return "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30";
    case "expired":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

// ─── Step index ─────────────────────────────────────────────────────────────

export function getStepIndex(status: UnifiedLoanStatus): number {
  if (status === "rejected" || status === "cancelled" || status === "expired") return -1;
  return UNIFIED_WORKFLOW_STEPS.findIndex((step) => step.status === status);
}

// ─── Customer helpers ───────────────────────────────────────────────────────

export function formatCustomerName(customer: Customer): string {
  return `${customer.name.firstName} ${customer.name.firstSurname}`.trim();
}

export function extractCustomerIdFromRequest(request: LoanRequest): string | undefined {
  if (typeof request.customerId === "string") return request.customerId;
  const candidate = request.customerId as unknown;
  if (candidate && typeof candidate === "object") {
    return (candidate as { _id?: string })._id;
  }
  return undefined;
}

// ─── User ref helpers ───────────────────────────────────────────────────────

export function formatUserRefName(userRef?: PopulatedUserRef): string {
  if (!userRef) return "—";
  if (userRef.name) {
    return `${userRef.name.firstName} ${userRef.name.firstSurname}`.trim();
  }
  return userRef.email ?? userRef._id;
}

// ─── Date / Money helpers ───────────────────────────────────────────────────

export function formatDate(dateValue: string): string {
  if (!dateValue) return "—";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMoney(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function daysRemaining(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// ─── Item display ───────────────────────────────────────────────────────────

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

// ─── Loan matching ──────────────────────────────────────────────────────────

export function findRelatedLoan(request: LoanRequest, loans: Loan[]): Loan | undefined {
  if (request.loanId) {
    return loans.find((loan) => loan._id === request.loanId);
  }
  return loans.find((loan) => loan.requestId === request._id);
}

// ─── View model builder ─────────────────────────────────────────────────────

export function buildUnifiedLoanViews(
  requests: LoanRequest[],
  loans: Loan[],
  customers: Customer[],
  packages: Package[],
  materialTypes: MaterialType[],
  language: "en" | "es" = "en",
): UnifiedLoanView[] {
  return requests.map((request) => {
    const relatedLoan = findRelatedLoan(request, loans);
    const status = getUnifiedStatus(request, relatedLoan);
    const statusLabel = getUnifiedStatusLabel(status, language);
    const customerId = extractCustomerIdFromRequest(request);
    const customer = customerId ? customers.find((entry) => entry._id === customerId) : undefined;

    return {
      request,
      loan: relatedLoan,
      status,
      statusLabel,
      customerName: customer ? formatCustomerName(customer) : "Unknown customer",
      itemCount: request.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
      displayItems: mapRequestItemsToDisplay(request.items, packages, materialTypes),
    };
  });
}

// ─── Tab filtering ──────────────────────────────────────────────────────────

export function getFilterTab(status: UnifiedLoanStatus): LoanFilterTab {
  switch (status) {
    case "pending":
    case "approved":
    case "assigned":
    case "ready":
    case "rejected":
    case "cancelled":
    case "expired":
      return "request";
    case "active":
    case "overdue":
      return "active_loan";
    case "returned":
    case "inspected":
    case "closed":
      return "completed";
    default:
      return "request";
  }
}

export function filterByTabAndSubFilter(
  views: UnifiedLoanView[],
  tab: LoanFilterTab,
  subFilter: LoanSubFilter,
): UnifiedLoanView[] {
  return views.filter((v) => {
    if (tab !== "all" && getFilterTab(v.status) !== tab) return false;
    if (subFilter !== "all" && v.status !== subFilter) return false;
    return true;
  });
}

export function filterBySearch(views: UnifiedLoanView[], searchTerm: string): UnifiedLoanView[] {
  if (!searchTerm.trim()) return views;
  const normalized = normalizeSearchText(searchTerm);
  return views.filter((v) => {
    const code = (v.request.code ?? v.request._id).toLowerCase();
    const name = normalizeSearchText(v.customerName);
    return code.includes(normalized) || name.includes(normalized);
  });
}
