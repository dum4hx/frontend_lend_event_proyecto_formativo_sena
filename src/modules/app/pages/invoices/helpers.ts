import type { Invoice, InvoiceStatus, InvoiceType, InvoiceCustomer } from "./types";
import { getInvoiceStatusLabel, getInvoiceTypeLabel } from "../../../../utils/statusLabels";

/** Status → Tailwind badge classes. */
export function getStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case "paid":
      return "text-green-400 bg-green-500/10";
    case "partially_paid":
      return "text-blue-400 bg-blue-500/10";
    case "pending":
      return "text-yellow-400 bg-yellow-500/10";
    case "overdue":
      return "text-red-400 bg-red-500/10";
    case "cancelled":
      return "text-gray-400 bg-gray-500/10";
    case "refunded":
      return "text-orange-400 bg-orange-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
}

/** Localized status label. */
export function getStatusLabel(status: InvoiceStatus, language: "en" | "es"): string {
  return getInvoiceStatusLabel(status, language);
}

/** Localized invoice type label. */
export function getTypeLabel(type: InvoiceType, language: "en" | "es"): string {
  return getInvoiceTypeLabel(type, language);
}

/** Row left-border color based on invoice status. */
export function getRowBorderColor(invoice: Invoice): string {
  if (invoice.status === "paid") return "border-l-4 border-green-500";
  if (invoice.status === "partially_paid") return "border-l-4 border-blue-500";
  if (invoice.status === "overdue") return "border-l-4 border-red-500";
  if (invoice.status === "cancelled") return "border-l-4 border-gray-500";
  if (invoice.status === "refunded") return "border-l-4 border-orange-500";
  return "border-l-4 border-yellow-500";
}

/** Resolve customer display name from populated or string field. */
export function getCustomerName(customerId: InvoiceCustomer | string): string {
  if (typeof customerId === "object" && customerId !== null) {
    const { firstName, firstSurname } = customerId.name;
    return `${firstName} ${firstSurname}`.trim();
  }
  return typeof customerId === "string" ? customerId : "";
}
