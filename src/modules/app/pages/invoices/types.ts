export type {
  Invoice,
  InvoiceStatus,
  InvoiceType,
  InvoiceCustomer,
  PaymentMethod,
  InvoiceSummary,
} from "../../../../types/api";

/** Tab options for the invoices dashboard. */
export type InvoiceTab = "all" | "pending" | "overdue";
