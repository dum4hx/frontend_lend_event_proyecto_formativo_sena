import type { Invoice, InvoiceStatus, InvoiceType, InvoiceCustomer } from "./types";

/** Status → Tailwind badge classes. */
export function getStatusColor(status: InvoiceStatus): string {
  switch (status) {
    case "paid":
      return "text-green-400 bg-green-500/10";
    case "pending":
      return "text-yellow-400 bg-yellow-500/10";
    case "cancelled":
      return "text-gray-400 bg-gray-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
}

/** Localized status label. */
export function getStatusLabel(status: InvoiceStatus, isEs: boolean): string {
  switch (status) {
    case "paid":
      return isEs ? "Pagado" : "Paid";
    case "pending":
      return isEs ? "Pendiente" : "Pending";
    case "cancelled":
      return isEs ? "Cancelado" : "Cancelled";
    default:
      return status;
  }
}

/** Localized invoice type label. */
export function getTypeLabel(type: InvoiceType, isEs: boolean): string {
  switch (type) {
    case "rental":
      return isEs ? "Alquiler" : "Rental";
    case "damage":
      return isEs ? "Daño" : "Damage";
    case "deposit":
      return isEs ? "Depósito" : "Deposit";
    default:
      return type;
  }
}

/** Row left-border color based on invoice status. */
export function getRowBorderColor(invoice: Invoice): string {
  if (invoice.status === "paid") return "border-l-4 border-green-500";
  if (invoice.status === "cancelled") return "border-l-4 border-gray-500";
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
