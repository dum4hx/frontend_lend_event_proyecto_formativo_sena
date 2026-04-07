/**
 * statusLabels.ts — Central source of truth for bilingual status labels and
 * badge colour maps across the entire application.
 *
 * Pattern (mirrors maintenance/utils/statusMapper.ts — canonical):
 *   Record<Status, { en: string; es: string }> + getXLabel(status, language)
 *
 * Color maps use `badge-*` utility classes expected by StatusBadge's colorMap prop.
 * They can also be used as the source for inline badge spans in components that
 * do not use the StatusBadge component.
 *
 * NOTE: These bilingual maps are self-contained and intentionally do NOT depend
 * on the i18n t() system so they can be consumed outside React component context
 * (e.g., in service-layer helpers, utility functions, or table column definitions).
 */

import type {
  UserStatus,
  OrganizationStatus,
  CustomerStatus,
  SubscriptionStatus,
  MaterialInstanceStatus,
  LoanRequestStatus,
  LoanStatus,
  DepositStatus,
  InspectionCondition,
  IncidentStatus,
  IncidentType,
  IncidentSeverity,
  InvoiceStatus,
  InvoiceType,
  EventStatus,
  RentalStatus,
  TransferRequestStatus,
  TransferStatus,
  TransferCondition,
  CodeSchemeEntityType,
  OpsTaskPriority,
} from "../types/api";

// ─── Primitives ────────────────────────────────────────────────────────────

/** Bilingual label pair used in every status map. */
export type StatusLocale = { en: string; es: string };

/**
 * Generic helper that resolves the localised label for any status using a map.
 * Falls back to the raw status value if the key is not present.
 */
export function getLabel<T extends string>(
  map: Record<T, StatusLocale>,
  status: T,
  language: "en" | "es",
): string {
  return map[status]?.[language] ?? status;
}

// ─── User ──────────────────────────────────────────────────────────────────

export const USER_STATUS_MAP: Record<UserStatus, StatusLocale> = {
  active: { en: "Active", es: "Activo" },
  inactive: { en: "Inactive", es: "Inactivo" },
  invited: { en: "Invited", es: "Invitado" },
  suspended: { en: "Suspended", es: "Suspendido" },
};

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  active: "badge-success",
  inactive: "badge-danger",
  invited: "badge-warning",
  suspended: "badge-danger",
};

export function getUserStatusLabel(status: UserStatus, language: "en" | "es"): string {
  return getLabel(USER_STATUS_MAP, status, language);
}

// ─── Organization ──────────────────────────────────────────────────────────

export const ORGANIZATION_STATUS_MAP: Record<OrganizationStatus, StatusLocale> = {
  active: { en: "Active", es: "Activo" },
  suspended: { en: "Suspended", es: "Suspendido" },
};

export const ORGANIZATION_STATUS_COLORS: Record<OrganizationStatus, string> = {
  active: "badge-success",
  suspended: "badge-danger",
};

export function getOrganizationStatusLabel(
  status: OrganizationStatus,
  language: "en" | "es",
): string {
  return getLabel(ORGANIZATION_STATUS_MAP, status, language);
}

// ─── Customer ──────────────────────────────────────────────────────────────

export const CUSTOMER_STATUS_MAP: Record<CustomerStatus, StatusLocale> = {
  active: { en: "Active", es: "Activo" },
  inactive: { en: "Inactive", es: "Inactivo" },
  blacklisted: { en: "Blacklisted", es: "En lista negra" },
};

export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  active: "badge-success",
  inactive: "badge-danger",
  blacklisted: "badge-danger",
};

export function getCustomerStatusLabel(status: CustomerStatus, language: "en" | "es"): string {
  return getLabel(CUSTOMER_STATUS_MAP, status, language);
}

// ─── Subscription ──────────────────────────────────────────────────────────

export const SUBSCRIPTION_STATUS_MAP: Record<SubscriptionStatus, StatusLocale> = {
  active: { en: "Active", es: "Activo" },
  inactive: { en: "Inactive", es: "Inactivo" },
  deprecated: { en: "Deprecated", es: "Obsoleto" },
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: "badge-success",
  inactive: "badge-danger",
  deprecated: "badge-neutral",
};

export function getSubscriptionStatusLabel(
  status: SubscriptionStatus,
  language: "en" | "es",
): string {
  return getLabel(SUBSCRIPTION_STATUS_MAP, status, language);
}

// ─── Material Instance ─────────────────────────────────────────────────────

export const MATERIAL_INSTANCE_STATUS_MAP: Record<MaterialInstanceStatus, StatusLocale> = {
  available: { en: "Available", es: "Disponible" },
  reserved: { en: "Reserved", es: "Reservado" },
  loaned: { en: "Loaned", es: "Prestado" },
  returned: { en: "Returned", es: "Devuelto" },
  maintenance: { en: "Maintenance", es: "Mantenimiento" },
  damaged: { en: "Damaged", es: "Dañado" },
  lost: { en: "Lost", es: "Perdido" },
  retired: { en: "Retired", es: "Retirado" },
  in_use: { en: "In Use", es: "En Uso" },
};

export const MATERIAL_INSTANCE_STATUS_COLORS: Record<MaterialInstanceStatus, string> = {
  available: "badge-success",
  reserved: "badge-warning",
  loaned: "badge-info",
  returned: "badge-info",
  maintenance: "badge-warning",
  damaged: "badge-danger",
  lost: "badge-danger",
  retired: "badge-danger",
  in_use: "badge-info",
};

export function getMaterialInstanceStatusLabel(
  status: MaterialInstanceStatus,
  language: "en" | "es",
): string {
  return getLabel(MATERIAL_INSTANCE_STATUS_MAP, status, language);
}

// ─── Loan Request ──────────────────────────────────────────────────────────

export const LOAN_REQUEST_STATUS_MAP: Record<LoanRequestStatus, StatusLocale> = {
  pending: { en: "Pending", es: "Pendiente" },
  approved: { en: "Approved", es: "Aprobado" },
  deposit_pending: { en: "Deposit Pending", es: "Depósito Pendiente" },
  assigned: { en: "Assigned", es: "Asignado" },
  ready: { en: "Ready", es: "Listo" },
  shipped: { en: "Shipped", es: "Enviado" },
  completed: { en: "Completed", es: "Completado" },
  rejected: { en: "Rejected", es: "Rechazado" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
  expired: { en: "Expired", es: "Vencido" },
};

export const LOAN_REQUEST_STATUS_COLORS: Record<LoanRequestStatus, string> = {
  pending: "badge-warning",
  approved: "badge-success",
  deposit_pending: "badge-warning",
  assigned: "badge-info",
  ready: "badge-info",
  shipped: "badge-info",
  completed: "badge-success",
  rejected: "badge-danger",
  cancelled: "badge-danger",
  expired: "badge-danger",
};

export function getLoanRequestStatusLabel(
  status: LoanRequestStatus,
  language: "en" | "es",
): string {
  return getLabel(LOAN_REQUEST_STATUS_MAP, status, language);
}

// ─── Loan ──────────────────────────────────────────────────────────────────

export const LOAN_STATUS_MAP: Record<LoanStatus, StatusLocale> = {
  active: { en: "Active", es: "Activo" },
  overdue: { en: "Overdue", es: "Vencido" },
  returned: { en: "Returned", es: "Devuelto" },
  closed: { en: "Closed", es: "Cerrado" },
};

export const LOAN_STATUS_COLORS: Record<LoanStatus, string> = {
  active: "badge-success",
  overdue: "badge-warning",
  returned: "badge-info",
  closed: "badge-neutral",
};

export function getLoanStatusLabel(status: LoanStatus, language: "en" | "es"): string {
  return getLabel(LOAN_STATUS_MAP, status, language);
}

// ─── Deposit ───────────────────────────────────────────────────────────────

export const DEPOSIT_STATUS_MAP: Record<DepositStatus, StatusLocale> = {
  not_required: { en: "Not Required", es: "No Requerido" },
  held: { en: "Held", es: "Retenido" },
  partially_applied: { en: "Partially Applied", es: "Parcialmente Aplicado" },
  applied: { en: "Applied", es: "Aplicado" },
  refund_pending: { en: "Refund Pending", es: "Reembolso Pendiente" },
  refunded: { en: "Refunded", es: "Reembolsado" },
};

export const DEPOSIT_STATUS_COLORS: Record<DepositStatus, string> = {
  not_required: "badge-neutral",
  held: "badge-success",
  partially_applied: "badge-warning",
  applied: "badge-gold",
  refund_pending: "badge-warning",
  refunded: "badge-success",
};

export function getDepositStatusLabel(status: DepositStatus, language: "en" | "es"): string {
  return getLabel(DEPOSIT_STATUS_MAP, status, language);
}

// ─── Inspection Condition ──────────────────────────────────────────────────

export const INSPECTION_CONDITION_MAP: Record<InspectionCondition, StatusLocale> = {
  good: { en: "Good", es: "Bueno" },
  damaged: { en: "Damaged", es: "Dañado" },
  lost: { en: "Lost", es: "Perdido" },
};

export const INSPECTION_CONDITION_COLORS: Record<InspectionCondition, string> = {
  good: "badge-success",
  damaged: "badge-danger",
  lost: "badge-danger",
};

export function getInspectionConditionLabel(
  condition: InspectionCondition,
  language: "en" | "es",
): string {
  return getLabel(INSPECTION_CONDITION_MAP, condition, language);
}

// ─── Incident Status ───────────────────────────────────────────────────────

export const INCIDENT_STATUS_MAP: Record<IncidentStatus, StatusLocale> = {
  open: { en: "Open", es: "Abierto" },
  acknowledged: { en: "Acknowledged", es: "Reconocido" },
  resolved: { en: "Resolved", es: "Resuelto" },
  dismissed: { en: "Dismissed", es: "Descartado" },
};

export const INCIDENT_STATUS_COLORS: Record<IncidentStatus, string> = {
  open: "badge-danger",
  acknowledged: "badge-warning",
  resolved: "badge-success",
  dismissed: "badge-neutral",
};

export function getIncidentStatusLabel(status: IncidentStatus, language: "en" | "es"): string {
  return getLabel(INCIDENT_STATUS_MAP, status, language);
}

// ─── Incident Severity ─────────────────────────────────────────────────────

export const INCIDENT_SEVERITY_MAP: Record<IncidentSeverity, StatusLocale> = {
  low: { en: "Low", es: "Baja" },
  medium: { en: "Medium", es: "Media" },
  high: { en: "High", es: "Alta" },
  critical: { en: "Critical", es: "Crítica" },
};

export const INCIDENT_SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: "badge-info",
  medium: "badge-warning",
  high: "badge-danger",
  critical: "badge-danger",
};

export function getIncidentSeverityLabel(
  severity: IncidentSeverity,
  language: "en" | "es",
): string {
  return getLabel(INCIDENT_SEVERITY_MAP, severity, language);
}

// ─── Incident Type ─────────────────────────────────────────────────────────

export const INCIDENT_TYPE_MAP: Record<IncidentType, StatusLocale> = {
  damage: { en: "Damage", es: "Daño" },
  lost: { en: "Lost", es: "Pérdida" },
  overdue: { en: "Overdue", es: "Vencimiento" },
  issue: { en: "Issue", es: "Problema" },
  replacement: { en: "Replacement", es: "Reemplazo" },
  extended: { en: "Extended", es: "Extendido" },
  other: { en: "Other", es: "Otro" },
};

export function getIncidentTypeLabel(type: IncidentType, language: "en" | "es"): string {
  return getLabel(INCIDENT_TYPE_MAP, type, language);
}

// ─── Invoice Status ────────────────────────────────────────────────────────

export const INVOICE_STATUS_MAP: Record<InvoiceStatus, StatusLocale> = {
  draft: { en: "Draft", es: "Borrador" },
  pending: { en: "Pending", es: "Pendiente" },
  paid: { en: "Paid", es: "Pagado" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "badge-warning",
  pending: "badge-warning",
  paid: "badge-success",
  cancelled: "badge-danger",
};

export function getInvoiceStatusLabel(status: InvoiceStatus, language: "en" | "es"): string {
  return getLabel(INVOICE_STATUS_MAP, status, language);
}

// ─── Invoice Type ──────────────────────────────────────────────────────────

export const INVOICE_TYPE_MAP: Record<InvoiceType, StatusLocale> = {
  rental: { en: "Rental", es: "Alquiler" },
  damage: { en: "Damage", es: "Daño" },
  deposit: { en: "Deposit", es: "Depósito" },
};

export function getInvoiceTypeLabel(type: InvoiceType, language: "en" | "es"): string {
  return getLabel(INVOICE_TYPE_MAP, type, language);
}

// ─── Event Status ──────────────────────────────────────────────────────────

export const EVENT_STATUS_MAP: Record<EventStatus, StatusLocale> = {
  draft: { en: "Draft", es: "Borrador" },
  confirmed: { en: "Confirmed", es: "Confirmado" },
  in_progress: { en: "In Progress", es: "En Progreso" },
  completed: { en: "Completed", es: "Completado" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: "badge-warning",
  confirmed: "badge-success",
  in_progress: "badge-info",
  completed: "badge-success",
  cancelled: "badge-danger",
};

export function getEventStatusLabel(status: EventStatus, language: "en" | "es"): string {
  return getLabel(EVENT_STATUS_MAP, status, language);
}

// ─── Rental Status ─────────────────────────────────────────────────────────

export const RENTAL_STATUS_MAP: Record<RentalStatus, StatusLocale> = {
  pending: { en: "Pending", es: "Pendiente" },
  active: { en: "Active", es: "Activo" },
  returned: { en: "Returned", es: "Devuelto" },
  overdue: { en: "Overdue", es: "Vencido" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
};

export const RENTAL_STATUS_COLORS: Record<RentalStatus, string> = {
  pending: "badge-warning",
  active: "badge-success",
  returned: "badge-info",
  overdue: "badge-warning",
  cancelled: "badge-danger",
};

export function getRentalStatusLabel(status: RentalStatus, language: "en" | "es"): string {
  return getLabel(RENTAL_STATUS_MAP, status, language);
}

// ─── Transfer Request Status ───────────────────────────────────────────────

export const TRANSFER_REQUEST_STATUS_MAP: Record<TransferRequestStatus, StatusLocale> = {
  requested: { en: "Requested", es: "Solicitado" },
  approved: { en: "Approved", es: "Aprobado" },
  rejected: { en: "Rejected", es: "Rechazado" },
  fulfilled: { en: "Fulfilled", es: "Cumplido" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
};

export const TRANSFER_REQUEST_STATUS_COLORS: Record<TransferRequestStatus, string> = {
  requested: "badge-warning",
  approved: "badge-success",
  rejected: "badge-danger",
  fulfilled: "badge-info",
  cancelled: "badge-danger",
};

export function getTransferRequestStatusLabel(
  status: TransferRequestStatus,
  language: "en" | "es",
): string {
  return getLabel(TRANSFER_REQUEST_STATUS_MAP, status, language);
}

// ─── Transfer Status ───────────────────────────────────────────────────────

export const TRANSFER_STATUS_MAP: Record<TransferStatus, StatusLocale> = {
  in_transit: { en: "In Transit", es: "En Tránsito" },
  completed: { en: "Completed", es: "Completado" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
  received: { en: "Received", es: "Recibido" },
};

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  in_transit: "badge-info",
  completed: "badge-success",
  cancelled: "badge-danger",
  received: "badge-success",
};

export function getTransferStatusLabel(status: TransferStatus, language: "en" | "es"): string {
  return getLabel(TRANSFER_STATUS_MAP, status, language);
}

// ─── Transfer Condition ────────────────────────────────────────────────────

export const TRANSFER_CONDITION_MAP: Record<TransferCondition, StatusLocale> = {
  OK: { en: "OK", es: "OK" },
  DAMAGED: { en: "Damaged", es: "Dañado" },
  MISSING_PARTS: { en: "Missing Parts", es: "Piezas Faltantes" },
  DIRTY: { en: "Dirty", es: "Sucio" },
  REPAIR_REQUIRED: { en: "Repair Required", es: "Reparación Requerida" },
  LOST: { en: "Lost", es: "Perdido" },
};

export const TRANSFER_CONDITION_COLORS: Record<TransferCondition, string> = {
  OK: "badge-success",
  DAMAGED: "badge-danger",
  MISSING_PARTS: "badge-warning",
  DIRTY: "badge-warning",
  REPAIR_REQUIRED: "badge-warning",
  LOST: "badge-danger",
};

export function getTransferConditionLabel(
  condition: TransferCondition,
  language: "en" | "es",
): string {
  return getLabel(TRANSFER_CONDITION_MAP, condition, language);
}

// ─── Payment Method Status ─────────────────────────────────────────────────

/** PaymentMethod.status — no dedicated named type in api.ts, defined locally. */
export type PaymentMethodStatus = "active" | "inactive";

export const PAYMENT_METHOD_STATUS_MAP: Record<PaymentMethodStatus, StatusLocale> = {
  active: { en: "Active", es: "Activo" },
  inactive: { en: "Inactive", es: "Inactivo" },
};

export const PAYMENT_METHOD_STATUS_COLORS: Record<PaymentMethodStatus, string> = {
  active: "badge-success",
  inactive: "badge-danger",
};

export function getPaymentMethodStatusLabel(
  status: PaymentMethodStatus,
  language: "en" | "es",
): string {
  return getLabel(PAYMENT_METHOD_STATUS_MAP, status, language);
}

// ─── Code Scheme Entity Type ───────────────────────────────────────────────

export const CODE_SCHEME_ENTITY_TYPE_MAP: Record<CodeSchemeEntityType, StatusLocale> = {
  loan: { en: "Loan", es: "Préstamo" },
  loan_request: { en: "Loan Request", es: "Solicitud de Préstamo" },
};

export function getCodeSchemeEntityTypeLabel(
  entityType: CodeSchemeEntityType,
  language: "en" | "es",
): string {
  return getLabel(CODE_SCHEME_ENTITY_TYPE_MAP, entityType, language);
}

// ─── Ops Task Priority ─────────────────────────────────────────────────────

export const OPS_TASK_PRIORITY_MAP: Record<OpsTaskPriority, StatusLocale> = {
  critical: { en: "Critical", es: "Crítica" },
  high: { en: "High", es: "Alta" },
  medium: { en: "Medium", es: "Media" },
  low: { en: "Low", es: "Baja" },
};

export const OPS_TASK_PRIORITY_COLORS: Record<OpsTaskPriority, string> = {
  critical: "badge-danger",
  high: "badge-danger",
  medium: "badge-warning",
  low: "badge-info",
};

export function getOpsTaskPriorityLabel(priority: OpsTaskPriority, language: "en" | "es"): string {
  return getLabel(OPS_TASK_PRIORITY_MAP, priority, language);
}
