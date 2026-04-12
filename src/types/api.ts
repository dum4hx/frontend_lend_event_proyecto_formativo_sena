/**
 * TypeScript interfaces for every API entity and payload.
 *
 * These mirror the shapes described in `API_DOCUMENTATION.md` and are
 * imported by service modules and components to ensure compile-time
 * safety across the entire frontend.
 */

// ─── API Error Codes ───────────────────────────────────────────────────────

/** Known API error codes returned by the backend. */
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "PLAN_LIMIT_REACHED"
  | "UNAUTHORIZED"
  | "ORGANIZATION_SUSPENDED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

/** Rate-limit information extracted from response headers. */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetSeconds: number;
}

// ─── Shared / Utility ──────────────────────────────────────────────────────

/** Paginated list metadata returned by list endpoints. */
export interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
}

/** Re-usable name object used by users and customers. */
export interface PersonName {
  firstName: string;
  secondName?: string;
  firstSurname: string;
  secondSurname?: string;
}

/** Colombian address shared between organizations, customers, and locations. */
export interface Address {
  streetType?: string;
  primaryNumber?: string;
  secondaryNumber?: string;
  complementaryNumber?: string;
  department?: string;
  city?: string;
  additionalDetails?: string;
  postalCode?: string;
}

export type TraceabilityEventType =
  | "checkout"
  | "return_received"
  | "sent"
  | "received"
  | (string & {});

/** Material lifecycle event emitted during loans and transfers. */
export interface TraceabilityEvent {
  eventType: TraceabilityEventType;
  occurredAt: string;
  performedBy?: string;
  performedByName?: string;
  performedByEmail?: string;
  notes?: string;
}

/** @deprecated Use TraceabilityEvent instead. */
export type MaterialTraceabilityEvent = TraceabilityEvent;

// ─── User ──────────────────────────────────────────────────────────────────

export type UserStatus = "active" | "inactive" | "invited" | "suspended";

export interface User {
  _id: string;
  email: string;
  name: PersonName;
  roleName: string;
  roleId: string;
  status: UserStatus;
  phone?: string;
  organizationId?: string;
  permissions?: string[];
  /** Location IDs accessible to this user. */
  locations?: string[];
}

// ─── Organization ──────────────────────────────────────────────────────────

export type OrganizationStatus = "active" | "suspended";

export interface OrganizationSubscription {
  plan: string;
  seatCount: number;
  catalogItemCount: number;
  currentPeriodEnd: string;
}

export interface Organization {
  _id: string;
  name: string;
  legalName: string;
  email: string;
  phone?: string;
  taxId?: string;
  address?: Address;
  status: OrganizationStatus;
  subscription: OrganizationSubscription;
}

export interface OrganizationUsage {
  currentCatalogItems: number;
  maxCatalogItems: number;
  currentSeats: number;
  maxSeats: number;
  canAddCatalogItem: boolean;
  canAddSeat: boolean;
}

/** Organization policy settings managed via GET/PATCH /organizations/settings. */
export interface OrganizationSettings {
  damageDueDays: number;
  requireFullPaymentBeforeCheckout: boolean;
}

// ─── Subscription Types ────────────────────────────────────────────────────

export type BillingModel = "fixed" | "dynamic";
export type SubscriptionStatus = "active" | "inactive" | "deprecated";

export interface SubscriptionType {
  _id: string;
  plan: string;
  displayName: string;
  description?: string;
  billingModel: BillingModel;
  baseCost: number;
  pricePerSeat: number;
  maxSeats: number;
  maxCatalogItems: number;
  durationDays: number;
  features: string[];
  sortOrder: number;
  stripePriceIdBase?: string;
  stripePriceIdSeat?: string;
  status: SubscriptionStatus;
}

export type PublicPlan = AvailablePlan & {
  description?: string;
  basePriceMonthly: number;
  plan: string;
  durationDays?: number;
};

/** Payload when creating a new subscription type (super-admin). */
export interface CreateSubscriptionTypePayload {
  plan: string;
  displayName: string;
  description?: string;
  billingModel: BillingModel;
  baseCost: number;
  pricePerSeat: number;
  maxSeats?: number;
  maxCatalogItems?: number;
  durationDays: number;
  features?: string[];
  sortOrder?: number;
  stripePriceIdBase?: string;
  stripePriceIdSeat?: string;
  status?: SubscriptionStatus;
}

export interface PlanCostResult {
  plan: string;
  seatCount: number;
  baseCost: number;
  seatCost: number;
  totalCost: number;
  currency: string;
}

/** Public-facing plan info from GET /organizations/plans. */
export interface AvailablePlan {
  name: string;
  displayName: string;
  billingModel: BillingModel;
  maxCatalogItems: number;
  maxSeats: number;
  features: string[];
  basePriceMonthly: number;
  pricePerSeat: number;
}

// ─── Customer ──────────────────────────────────────────────────────────────

export type DocumentType = "cc" | "ce" | "passport" | "nit" | "other";

export interface DocumentTypeInfo {
  value: DocumentType;
  displayName: string;
  description: string;
}

export type CustomerStatus = "active" | "inactive" | "blacklisted";

// ─── Material Attributes ───────────────────────────────────────────────────

/** Organization-wide material attribute definition (global library). */
export interface MaterialAttribute {
  _id: string;
  organizationId: string;
  name: string;
  unit: string;
  allowedValues: string[];
  createdAt: string;
  updatedAt: string;
  /** Frontend-only usage stat (if backend provides it, otherwise manually calculated) */
  usageCount?: number;
}

/** Payload to create a new material attribute definition. */
export interface CreateMaterialAttributePayload {
  name: string;
  unit: string;
  allowedValues?: string[];
}

/** Payload to update an existing material attribute definition. */
export interface UpdateMaterialAttributePayload {
  name?: string;
  unit?: string;
  allowedValues?: string[];
}

export interface Customer {
  _id: string;
  name: PersonName;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  address?: Address;
  status: CustomerStatus;
}

export interface CreateCustomerPayload {
  name: PersonName;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  address?: Address;
}

export interface UpdateCustomerPayload {
  name?: Partial<PersonName>;
  email?: string;
  phone?: string;
  address?: Address;
}

// ─── Materials ─────────────────────────────────────────────────────────────

/** Attribute reference within a category (defines which attributes belong and if required). */
export interface CategoryAttribute {
  attributeId: string;
  isRequired: boolean;
}

/** Material category that groups material types and defines available attributes. */
export interface MaterialCategory {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  attributes: CategoryAttribute[];
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a new material category. */
export interface CreateMaterialCategoryPayload {
  name: string;
  code: string;
  description?: string;
  attributes?: CategoryAttribute[];
}

/** Payload to update an existing material category. */
export interface UpdateMaterialCategoryPayload {
  name?: string;
  description?: string;
  attributes?: CategoryAttribute[];
}

/** Attribute value assignment within a material type. */
export interface MaterialTypeAttribute {
  attributeId: string;
  value: string;
  isRequired: boolean;
}

/** Material type (catalog item) that can be rented/loaned. */
export interface MaterialType {
  _id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string;
  categoryId:
    | {
        _id: string;
        name: string;
      }
    | string;
  pricePerDay: number;
  attributes: MaterialTypeAttribute[];
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a new material type. */
export interface CreateMaterialTypePayload {
  code: string;
  name: string;
  description?: string;
  categoryId: string[];
  pricePerDay: number;
  attributes?: MaterialTypeAttribute[];
}

/** Payload to update an existing material type. */
export interface UpdateMaterialTypePayload {
  name?: string;
  description?: string;
  categoryId?: string[];
  pricePerDay?: number;
  attributes?: MaterialTypeAttribute[];
}

export type MaterialInstanceStatus =
  | "available"
  | "reserved"
  | "loaned"
  | "returned"
  | "maintenance"
  | "damaged"
  | "lost"
  | "retired"
  | "in_use";

export const MATERIAL_INSTANCE_STATUS_LABELS: Record<MaterialInstanceStatus, string> = {
  available: "AVAILABLE",
  reserved: "RESERVED",
  loaned: "LOANED",
  returned: "RETURNED",
  maintenance: "MAINTENANCE",
  damaged: "DAMAGED",
  lost: "LOST",
  retired: "RETIRED",
  in_use: "IN USE",
};

export interface MaterialInstanceLoanContext {
  loanCode?: string | null;
  requestCode?: string | null;
}

export interface MaterialInstance {
  _id: string;
  /**
   * The parent model (Material Type) - comes as model from API.
   */
  model: {
    _id: string;
    name: string;
    description?: string;
    /** Rental price in cents (COP) per day. */
    pricePerDay: number;
  };
  /**
   * Unique identifier for this specific instance (e.g., serial number).
   */
  serialNumber: string;
  /**
   * Unique scannable code associated with the physical unit.
   */
  barcode?: string;
  status: MaterialInstanceStatus;
  /**
   * Location where this instance is currently stored - comes as locationId from API.
   */
  locationId: {
    _id: string;
    name: string;
    id: string;
  };
  /** Organization ID */
  organizationId: string;
  /** Attributes array */
  attributes: MaterialTypeAttribute[];
  /** Related loan/request codes included by the instance detail endpoint. */
  loanContext?: MaterialInstanceLoanContext;
  /** Date when the instance was created (ISO date string) */
  createdAt: string;
  /** Date when the instance was last updated (ISO date string) */
  updatedAt: string;
  /** Version key */
  __v: number;
}

export interface CreateMaterialInstancePayload {
  modelId: string;
  serialNumber?: string;
  barcode?: string;
  locationId: string;
  purchaseDate?: string;
  purchaseCost?: number;
}

// ─── Available Materials ────────────────────────────────────────────────────

export type AvailabilityTag = "available" | "upcoming";

/** A material instance enriched with an availability tag from GET /requests/:id/available-materials. */
export interface AvailableMaterialInstance extends MaterialInstance {
  availability: AvailabilityTag;
}

export interface LocationWithAvailableInstances {
  location: {
    _id: string;
    name: string;
  };
  instances: AvailableMaterialInstance[];
}

export interface AvailableMaterialsResponse {
  currentUserLocations: LocationWithAvailableInstances[];
  otherLocations: LocationWithAvailableInstances[];
}

export interface UpdateMaterialInstanceStatusPayload {
  status: MaterialInstanceStatus;
  notes?: string;
}

// ─── Packages ──────────────────────────────────────────────────────────────

export interface PackageMaterialEntry {
  materialTypeId: string;
  quantity: number;
}

export interface Package {
  _id: string;
  name: string;
  description?: string;
  items: PackageMaterialEntry[];
  // Backwards-compatible alias used by older frontend code
  materialTypes?: PackageMaterialEntry[];
  pricePerDay?: number;
  discountRate?: number;
  depositAmount?: number;
  status?: "active" | "inactive";
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  items: PackageMaterialEntry[];
  pricePerDay?: number;
}

export interface UpdatePackagePayload {
  name?: string;
  description?: string;
  items?: PackageMaterialEntry[];
  pricePerDay?: number;
}

// ─── Loan Requests ─────────────────────────────────────────────────────────

export type LoanRequestStatus =
  | "pending"
  | "approved"
  | "deposit_pending"
  | "assigned"
  | "ready"
  | "shipped"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired";

export interface LoanRequestItem {
  type?: "material" | "package";
  referenceId?: string;
  materialTypeId?: string;
  packageId?: string;
  quantity?: number;
  pricePerDay?: number;
  pricingConfigId?: string;
  pricingStrategyType?: string;
  totalPrice?: number;
}

/** Populated user reference returned by the backend when user fields are populated. */
export interface PopulatedUserRef {
  _id: string;
  email?: string;
  name?: PersonName;
}

/** Material instance entry in assignedMaterials on a LoanRequest. */
export interface AssignedMaterialEntry {
  materialInstanceId: {
    _id: string;
    serialNumber: string;
  };
  itemIndex: number;
}

export interface LoanRequest {
  _id: string;
  code?: string;
  customerId: {
    _id?: string;
    email: string;
    name: PersonName;
  };
  items: LoanRequestItem[];
  startDate: string;
  endDate: string;
  status: LoanRequestStatus;
  notes?: string;
  depositAmount?: number;
  depositDueDate?: string;
  depositPaidAt?: string;
  subtotal?: number;
  totalAmount?: number;
  discountAmount?: number;
  totalDays?: number;
  rentalFeePaidAt?: string;
  loanId?: string;
  locationId?: string;
  createdBy?: PopulatedUserRef;
  approvedBy?: PopulatedUserRef;
  approvedAt?: string;
  assignedBy?: PopulatedUserRef;
  assignedAt?: string;
  assignedMaterials?: AssignedMaterialEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLoanRequestPayload {
  customerId: string;
  items: LoanRequestItem[];
  depositAmount: number;
  startDate: string;
  endDate: string;
  depositDueDate: string;
  notes?: string;
}

export interface AssignMaterialPayload {
  materialTypeId: string;
  materialInstanceId: string;
}

// ─── Loans ─────────────────────────────────────────────────────────────────

export type LoanStatus = "active" | "overdue" | "returned" | "inspected" | "closed";

export type DepositStatus =
  | "not_required"
  | "held"
  | "partially_applied"
  | "applied"
  | "refund_pending"
  | "refunded";

export interface DepositTransaction {
  type: "held" | "applied" | "refund";
  amount: number;
  date: string;
  reference?: string;
}

/** Pricing snapshot item captured at checkout. */
export interface PricingSnapshotItem {
  itemType: string;
  referenceId: string;
  quantity: number;
  strategyType: string;
  configId?: string;
  durationInDays: number;
  basePricePerDay: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Loan {
  _id: string;
  code?: string;
  customerId: string | Customer;
  requestId?: string;
  requestCode?: string;
  status: LoanStatus;
  startDate: string;
  endDate: string;
  returnedAt?: string;
  notes?: string;
  totalAmount?: number;
  damageFees?: number;
  lateFees?: number;
  extensionFees?: number;
  deposit: {
    amount: number;
    status: DepositStatus;
    transactions: DepositTransaction[];
    refundAvailable?: boolean;
    refundableAmount?: number;
  };
  locationId?: string;
  checkedOutBy?: PopulatedUserRef;
  checkedOutAt?: string;
  preparedBy?: PopulatedUserRef;
  preparedAt?: string;
  traceabilityEvents?: MaterialTraceabilityEvent[];
  pricingSnapshot?: PricingSnapshotItem[];
  createdAt?: string;
  updatedAt?: string;
}

/** Loan from list endpoints (customerId is always populated as Customer). */
export interface LoanListItem extends Omit<Loan, "customerId"> {
  customerId: Customer;
}

/** Populated material instance entry returned by GET /loans/:id */
export interface LoanMaterialInstanceEntry {
  materialInstanceId: {
    _id: string;
    serialNumber: string;
    barcode?: string;
    status: string;
    modelId: string;
    name: string;
  };
  materialTypeId: string;
  materialType: {
    _id: string;
    name: string;
  };
  conditionAtCheckout?: string;
  conditionAtReturn?: string;
  notes?: string;
}

/** Detailed loan response (default — flat list of instances). */
export interface LoanDetail extends Omit<Loan, "customerId"> {
  customerId: Customer;
  materialInstances: LoanMaterialInstanceEntry[];
}

/** Detailed loan response with material instances grouped by type. */
export interface LoanDetailGrouped extends Omit<Loan, "customerId"> {
  customerId: Customer;
  materialInstancesByType: Record<string, { instances: LoanMaterialInstanceEntry[] }>;
}

export interface ExtendLoanPayload {
  newEndDate: string;
  /** Extension fee amount in the organization's currency (>= 0). Required by API. */
  extensionFee: number;
  notes?: string;
}

// ─── Inspections ───────────────────────────────────────────────────────────

export type InspectionCondition = "good" | "damaged" | "lost";

/** Request-side item shape for POST /inspections. */
export interface InspectionItemInput {
  materialInstanceId: string;
  condition: InspectionCondition;
  notes?: string;
  damageDescription?: string;
  damageCost?: number;
}

/** Response-side item shape returned by GET /inspections/:id. */
export interface InspectionItemResponse {
  materialInstanceId: {
    _id: string;
    serialNumber: string;
    modelId: string;
  };
  materialType: {
    _id: string;
    name: string;
  };
  conditionBefore?: InspectionCondition;
  conditionAfter: InspectionCondition;
  conditionDegraded?: boolean;
  notes?: string;
  damageDescription?: string;
  chargeToCustomer?: number;
  repairRequired?: boolean;
}

export interface Inspection {
  _id: string;
  organizationId: string;
  /** Auto-generated inspection code from the active code scheme. */
  inspectionNumber?: string;
  loanId: string;
  inspectedBy: {
    email: string;
    profile: { firstName: string };
    role?: {
      _id: string;
      name: string;
    };
  };
  items: InspectionItemResponse[];
  notes?: string;
  status: "completed";
  createdAt: string;
}

/** Shape returned by GET /inspections list (loanId is populated). */
export interface InspectionListItem extends Omit<Inspection, "loanId"> {
  loanId: {
    _id: string;
    code?: string;
    customerId: string;
    startDate: string;
    endDate: string;
  };
}

export interface CreateInspectionPayload {
  loanId: string;
  items: InspectionItemInput[];
  overallNotes?: string;
  dueDate?: string;
}

export interface InspectionsQueryParams {
  page?: number;
  limit?: number;
  loanId?: string;
}

export interface PendingLoan {
  _id: string;
  code?: string;
  customerId: {
    _id?: string;
    email: string;
    name: PersonName;
  };
  materialInstances: Array<{
    materialInstanceId: {
      _id: string;
      serialNumber: string;
      modelId: string;
    };
    materialTypeId: string;
    materialType?: {
      _id: string;
      name: string;
    };
  }>;
  startDate: string;
  endDate: string;
  status: "returned";
}

// ─── Incidents ─────────────────────────────────────────────────────────────

export type IncidentType =
  | "damage"
  | "lost"
  | "overdue"
  | "issue"
  | "replacement"
  | "extended"
  | "other";

export type IncidentStatus = "open" | "acknowledged" | "resolved" | "dismissed";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentSourceType = "inspection" | "scheduler" | "manual";

export type IncidentContext = "loan" | "transit" | "storage" | "maintenance" | "other";

export interface IncidentFinancialImpact {
  estimated?: number;
  actual?: number;
  currency?: string;
}

export interface Incident {
  _id: string;
  organizationId: string;
  /** Auto-generated incident code from the active code scheme. */
  incidentNumber?: string;
  context: IncidentContext;
  loanId?: string | Loan;
  locationId?: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  sourceType: IncidentSourceType;
  sourceId?: string;
  relatedMaterialInstances: string[];
  description: string;
  financialImpact?: IncidentFinancialImpact;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentPayload {
  context: IncidentContext;
  loanId?: string;
  locationId?: string;
  type: IncidentType;
  severity?: IncidentSeverity;
  relatedMaterialInstances?: string[];
  description?: string;
  financialImpact?: IncidentFinancialImpact;
  metadata?: Record<string, unknown>;
}

export interface ResolveIncidentPayload {
  resolution: string;
}

export interface IncidentQueryParams {
  page?: number;
  limit?: number;
  context?: IncidentContext;
  loanId?: string;
  locationId?: string;
  type?: IncidentType;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  sourceType?: IncidentSourceType;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Invoices ──────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "pending" | "partially_paid" | "paid" | "cancelled";
export type InvoiceType = "rental" | "damage" | "deposit";

export interface InvoiceLineItem {
  _id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  referenceId?: string;
  referenceType?: string;
}

export interface InvoicePayment {
  _id: string;
  amount: number;
  paymentMethodId?: string;
  method?: string;
  reference?: string;
  notes?: string;
  recordedAt?: string;
  paidAt?: string;
}

export interface InvoiceCustomer {
  _id: string;
  name: {
    firstName: string;
    firstSurname: string;
    secondName?: string;
    secondSurname?: string;
  };
  email?: string;
}

export interface InvoiceLoanMaterialInstance {
  materialInstanceId: string | { _id: string; serialNumber?: string; name?: string };
  materialTypeId: string | { _id: string; name?: string };
  conditionAtCheckout?: string;
}

export interface InvoiceLoan {
  _id: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  materialInstances?: InvoiceLoanMaterialInstance[];
}

export interface InvoiceInspection {
  _id: string;
  inspectionNumber?: string;
}

export interface Invoice {
  _id: string;
  organizationId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  type: InvoiceType;
  customerId: InvoiceCustomer | string;
  loanId?: InvoiceLoan | string;
  inspectionId?: InvoiceInspection | string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate?: string;
  payments: InvoicePayment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceSummary {
  pending: { count: number; total: number };
  paid: { count: number; total: number };
  overdueCount: number;
}

export interface RecordPaymentPayload {
  amount: number;
  paymentMethodId: string;
  reference?: string;
}

// ─── Payment Methods ───────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePaymentMethodPayload {
  name: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface UpdatePaymentMethodPayload {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
}

// ─── Maintenance Batches ───────────────────────────────────────────────────

/** Possible statuses for a maintenance batch. */
export type MaintenanceBatchStatus = "draft" | "in_progress" | "completed" | "cancelled";

/** Possible statuses for an individual maintenance item. */
export type MaintenanceItemStatus = "pending" | "in_repair" | "repaired" | "unrecoverable";

/** Reason an item entered maintenance. */
export type MaintenanceEntryReason = "damaged" | "lost" | "other";

/** Source that originated the maintenance item. */
export type MaintenanceSourceType = "inspection" | "incident" | "manual";

/** Final resolution of a maintenance item. */
export type MaintenanceResolution = "repaired" | "unrecoverable";

/** Populated material instance reference within a maintenance item. */
export interface MaintenanceMaterialInstanceRef {
  _id: string;
  serialNumber: string;
}

/** A single item within a maintenance batch. */
export interface MaintenanceBatchItem {
  _id: string;
  materialInstanceId: MaintenanceMaterialInstanceRef | string;
  entryReason: MaintenanceEntryReason;
  itemStatus: MaintenanceItemStatus;
  sourceType: MaintenanceSourceType;
  sourceId?: string;
  sourceItemIndex?: number;
  estimatedCost?: number;
  actualCost?: number;
  repairNotes?: string;
  resolvedAt?: string;
}

/** Full maintenance batch with populated references (detail view). */
export interface MaintenanceBatch {
  _id: string;
  /** Auto-generated batch code from the active code scheme. */
  batchNumber?: string;
  name: string;
  status: MaintenanceBatchStatus;
  items: MaintenanceBatchItem[];
  organizationId: string;
  createdBy: string;
  description?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  assignedTo?: { _id: string; email: string };
  locationId?: string;
  notes?: string;
  totalEstimatedCost: number;
  totalActualCost: number;
  createdAt: string;
  updatedAt: string;
}

/** Slim batch representation used in list responses. */
export interface MaintenanceBatchListItem {
  _id: string;
  /** Auto-generated batch code from the active code scheme. */
  batchNumber?: string;
  name: string;
  status: MaintenanceBatchStatus;
  items: MaintenanceBatchItem[];
  totalEstimatedCost: number;
  totalActualCost: number;
  createdAt: string;
  updatedAt: string;
}

/** Query parameters for listing maintenance batches. */
export interface MaintenanceBatchQueryParams {
  page?: number;
  limit?: number;
  status?: MaintenanceBatchStatus;
  assignedTo?: string;
}

/** Payload for creating a new maintenance batch. */
export interface CreateMaintenanceBatchPayload {
  name: string;
  description?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  assignedTo?: string;
  locationId?: string;
  notes?: string;
}

/** Payload for updating a draft maintenance batch. */
export interface UpdateMaintenanceBatchPayload {
  name?: string;
  description?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  assignedTo?: string;
  locationId?: string;
  notes?: string;
}

/** Single item input when adding items to a batch. */
export interface AddMaintenanceBatchItemInput {
  materialInstanceId: string;
  entryReason: MaintenanceEntryReason;
  sourceType: MaintenanceSourceType;
  sourceId?: string;
  sourceItemIndex?: number;
  estimatedCost?: number;
  repairNotes?: string;
}

/** Payload for adding items to a maintenance batch. */
export interface AddMaintenanceBatchItemsPayload {
  items: AddMaintenanceBatchItemInput[];
}

/** Payload for resolving a single maintenance item. */
export interface ResolveMaintenanceBatchItemPayload {
  resolution: MaintenanceResolution;
  actualCost?: number;
  repairNotes?: string;
}

// ─── Billing ───────────────────────────────────────────────────────────────

export interface CreateCheckoutPayload {
  plan: string;
  seatCount?: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
}

export interface CreatePortalPayload {
  returnUrl: string;
}

export interface UpdateSeatsPayload {
  seatCount: number;
}

export interface CancelSubscriptionPayload {
  cancelImmediately?: boolean;
}

export interface ChangePlanPayload {
  plan: string;
  seatCount?: number;
}

export interface ChangePlanResult {
  type: "upgrade" | "downgrade";
  effectiveDate: string;
  previousPlan: string;
  newPlan: string;
}

export interface PendingChange {
  pendingPlan: string;
  effectiveDate: string;
}

export interface PendingChangeData {
  pendingChange: PendingChange | null;
}

// ─── Admin Analytics ───────────────────────────────────────────────────────

export interface PlatformOverview {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRecurringRevenue: number;
  totalLoansProcessed: number;
  totalInvoicesGenerated: number;
}

export interface OrgStatsByStatus {
  status: string;
  count: number;
}

export interface OrgStatsByPlan {
  plan: string;
  count: number;
}

export interface GrowthTrend {
  period: string;
  newOrganizations?: number;
  newUsers?: number;
}

export interface OrganizationStats {
  byStatus: OrgStatsByStatus[];
  byPlan: OrgStatsByPlan[];
  growthTrend: GrowthTrend[];
  averageSeatCount: number;
  averageCatalogItemCount: number;
}

export interface UserStatsByRole {
  role: string;
  count: number;
}

export interface UserStatsByStatus {
  status: string;
  count: number;
}

export interface UserStats {
  byRole: UserStatsByRole[];
  byStatus: UserStatsByStatus[];
  growthTrend: GrowthTrend[];
  averageUsersPerOrganization: number;
}

export interface RevenueByPlan {
  plan: string;
  revenue: number;
  organizationCount: number;
}

export interface MonthlyTrend {
  period: string;
  revenue: number;
}

export interface RevenueStats {
  totalRevenue: number;
  revenueByPlan: RevenueByPlan[];
  monthlyTrend: MonthlyTrend[];
  averageRevenuePerOrganization: number;
}

export interface SubscriptionsByPlan {
  plan: string;
  count: number;
  percentage: number;
}

export interface SubscriptionStats {
  totalActiveSubscriptions: number;
  subscriptionsByPlan: SubscriptionsByPlan[];
  churnRate: number;
  upgrades: number;
  downgrades: number;
}

export interface PlatformHealth {
  overdueLoans: number;
  overdueInvoices: number;
  suspendedOrganizations: number;
  recentErrors: number;
}

export interface ActivityEvent {
  eventType: string;
  timestamp: string;
  amount?: number;
  plan?: string;
}

export interface AdminDashboardData {
  overview: PlatformOverview;
  organizationStats: OrganizationStats;
  userStats: UserStats;
  subscriptionStats: SubscriptionStats;
  health: PlatformHealth;
  generatedAt: string;
}

// ─── Organizations PII (Super Admin) ───────────────────────────────────────

export interface OrganizationPiiSubscription {
  plan: string;
  seatCount: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export interface OrganizationPii {
  _id: string;
  name: string;
  legalName: string;
  email: string;
  phone?: string;
  address?: Address;
  subscription: OrganizationPiiSubscription;
  status: OrganizationStatus;
  createdAt: string;
}

export interface OrganizationsPiiResponse {
  organizations: OrganizationPii[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Super Admin Operations ────────────────────────────────────────────────

/** Result of a bulk operation on subscription types. */
export interface BulkOperationResult<T> {
  succeeded: T[];
  failed: Array<{ item: T; error: string }>;
  total: number;
}

/** Filter options for analytics queries. */
export interface AnalyticsFilter {
  periodMonths?: number;
  startDate?: string;
  endDate?: string;
  plan?: string;
  status?: string;
}

/** Pagination request with optional filters. */
export interface PaginatedRequest<TFilter = Record<string, unknown>> {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: TFilter;
}

/** Generic paginated response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Operation status for async/batch operations. */
export type OperationStatus = "pending" | "in-progress" | "completed" | "failed" | "partial";

export interface OperationResult {
  status: OperationStatus;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

// ─── Auth Payloads ─────────────────────────────────────────────────────────

export interface RegisterPayload {
  organization: {
    name: string;
    legalName?: string;
    email?: string;
    phone?: string;
    taxId?: string;
    address?: Address;
  };
  owner: {
    email: string;
    password: string;
    phone?: string;
    name: PersonName;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginPendingOtpResponseData {
  pendingOtp: true;
  email: string;
}

export interface VerifyLoginOtpPayload {
  email: string;
  code: string;
}

export interface VerifyLoginOtpResponseData {
  user: User;
  permissions: string[];
  /** Only present on the very first 2FA login — 10 single-use backup codes. */
  backupCodes?: string[];
}

export interface VerifyBackupCodePayload {
  email: string;
  backupCode: string;
}

export interface VerifyBackupCodeResponseData {
  user: User;
  permissions: string[];
  remainingBackupCodes: number;
}

export interface ResendLoginOtpPayload {
  email: string;
  password: string;
}

export interface ResendLoginOtpResponseData {
  pendingOtp: true;
  email: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  email: string;
  code: string;
}

export interface VerifyResetCodeResponseData {
  resetToken: string;
}

export interface ResetPasswordPayload {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface AcceptInvitePayload {
  email: string;
  token: string;
  password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface VerifyEmailResponseData {
  organization: { id: string; name: string; email: string };
  user: User;
  permissions: string[];
}

// ─── Auth Responses ────────────────────────────────────────────────────────

export interface RegisterResponseData {
  organization: { id: string; name: string; email: string };
  user: User;
  permissions: string[];
}

/** @deprecated Use VerifyLoginOtpResponseData — login now requires OTP verification. */
export interface LoginResponseData {
  user: User;
  permissions: string[];
}

export interface MeResponseData {
  user: User;
  permissions: string[];
}

export interface PaymentStatusData {
  isActive: boolean;
  plan: string;
  organizationStatus: string;
}

export interface AcceptInviteResponseData {
  user: User;
}

// ─── User Management Payloads ──────────────────────────────────────────────

export interface InviteUserPayload {
  name: PersonName;
  email: string;
  phone: string;
  locations: string[];
  roleId: string;
}

export interface UpdateUserPayload {
  name?: Partial<PersonName>;
  email?: string;
  phone?: string;
  locations?: string[];
}

export interface UpdateUserRolePayload {
  roleId: string;
}

// ─── Roles & Permissions ───────────────────────────────────────────────────

/** Organization-scoped role definition */
export interface Role {
  _id: string;
  name: string;
  permissions: string[];
  description?: string;
  isReadOnly: boolean;
  type: "SYSTEM" | "CUSTOM";
}

/** Payload used to create a new role */
export interface CreateRolePayload {
  name: string;
  permissions: string[];
  description?: string;
}

/** Payload used to update an existing custom role (all fields optional) */
export interface UpdateRolePayload {
  name?: string;
  permissions?: string[];
  description?: string;
}

/** Paginated roles list response */
export interface RolesListResponse {
  items: Role[];
  total: number;
  page: number;
  limit: number;
}

/** Permission returned by GET /permissions */
export interface Permission {
  id: string;
  displayName: string;
  description: string;
  category: string;
  /** Whether this is a platform-only (super-admin) permission. */
  isPlatformPermission: boolean;
  /** Permission IDs that must also be assigned when granting this permission. */
  requires?: string[];
}

/** Permissions list response */
export type PermissionsResponse = Permission[];

// ─── Query Params ──────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UsersQueryParams extends PaginationParams {
  status?: UserStatus;
  roleId?: string;
  search?: string;
}

export interface CustomersQueryParams extends PaginationParams {
  status?: CustomerStatus;
  search?: string;
}

export interface MaterialTypesQueryParams extends PaginationParams {
  categoryId?: string;
  search?: string;
}

export interface MaterialInstancesQueryParams {
  status?: MaterialInstanceStatus;
  materialTypeId?: string;
  search?: string;
  byLocation?: boolean;
  byUserAccessibleLocation?: boolean;
}

export interface LoanRequestsQueryParams extends PaginationParams {
  status?: LoanRequestStatus;
  customerId?: string;
  packageId?: string;
}

export interface LoansQueryParams extends PaginationParams {
  status?: LoanStatus;
  customerId?: string;
  overdue?: boolean;
}

export interface LoanMaterialsQueryParams extends PaginationParams {
  search?: string;
  status?: MaterialInstanceStatus;
  materialTypeId?: string;
}

export interface LoanMaterialListItem {
  materialInstanceId: {
    _id: string;
    serialNumber: string;
    barcode?: string;
    status: MaterialInstanceStatus | string;
    modelId: string;
    name: string;
  };
  materialTypeId: string;
  materialType: {
    _id: string;
    name: string;
  };
  conditionAtCheckout?: string;
  conditionAtReturn?: string;
  notes?: string;
}

export interface LoanMaterialsResponse {
  loan: Pick<Loan, "_id" | "code" | "status">;
  materials: LoanMaterialListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface InvoicesQueryParams extends PaginationParams {
  status?: InvoiceStatus;
  type?: InvoiceType;
  overdue?: boolean;
}

// ─── Admin Analytics Query Params ──────────────────────────────────────────

export interface AnalyticsQueryParams {
  periodMonths?: number;
}

export interface ActivityQueryParams {
  limit?: number;
}

// ─── Billing History ───────────────────────────────────────────────────────

export interface BillingHistoryEntry {
  _id: string;
  organizationId: string;
  eventType: string;
  stripeCustomerId: string;
  stripeEventId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId?: string;
  amount?: number;
  currency: string;
  newPlan?: string;
  seatChange?: number;
  processed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Events & Rentals ──────────────────────────────────────────────────────

export type EventStatus = "draft" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type RentalStatus = "pending" | "active" | "returned" | "overdue" | "cancelled";

/** Event entity */
export interface Event {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  customerId?: string;
  customerName?: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: EventStatus;
  totalCost: number;
  materialsCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Event material assignment */
export interface EventMaterial {
  materialTypeId: string;
  materialTypeName: string;
  quantity: number;
  pricePerDay: number;
  totalCost: number;
  assignedInstances?: string[];
}

/** Rental entity */
export interface Rental {
  _id: string;
  eventId: string;
  eventName: string;
  customerId: string;
  customerName: string;
  organizationId: string;
  materialTypeId: string;
  materialTypeName: string;
  instanceId?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  returnDate?: string;
  pricePerDay: number;
  totalCost: number;
  status: RentalStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a new event */
export interface CreateEventPayload {
  name: string;
  description?: string;
  customerId?: string;
  startDate: string;
  endDate: string;
  location?: string;
}

/** Payload to update an existing event */
export interface UpdateEventPayload {
  name?: string;
  description?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status?: EventStatus;
}

/** Payload to assign materials to an event */
export interface AssignMaterialToEventPayload {
  materialTypeId: string;
  quantity: number;
  pricePerDay: number;
}

/** Payload to create a rental */
export interface CreateRentalPayload {
  eventId: string;
  customerId: string;
  materialTypeId: string;
  instanceId?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  pricePerDay: number;
  notes?: string;
}

/** Payload to update rental status */
export interface UpdateRentalStatusPayload {
  status: RentalStatus;
  returnDate?: string;
  notes?: string;
}

/** Events list response */
export interface EventsListResponse {
  items: Event[];
  pagination: PaginationMeta;
}

/** Event materials list response */
export interface EventMaterialsListResponse {
  items: EventMaterial[];
  pagination?: PaginationMeta;
}

/** Rentals list response */
export interface RentalsListResponse {
  items: Rental[];
  pagination: PaginationMeta;
}

/** Query params for events list */
export interface EventsQueryParams extends PaginationParams {
  status?: EventStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/** Query params for rentals list */
export interface RentalsQueryParams extends PaginationParams {
  status?: RentalStatus;
  eventId?: string;
  customerId?: string;
  materialTypeId?: string;
  overdue?: boolean;
}

// ─── Transfers ─────────────────────────────────────────────────────────────

export type TransferRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "fulfilled"
  | "cancelled";
export type TransferStatus = "in_transit" | "completed" | "cancelled" | "received";

/** Condition of a material instance during/after a transfer. */
export type TransferCondition =
  | "OK"
  | "DAMAGED"
  | "MISSING_PARTS"
  | "DIRTY"
  | "REPAIR_REQUIRED"
  | "LOST";

/** Model-level item in a transfer request (quantity, not instance-specific). */
export interface TransferRequestItem {
  modelId: string;
  quantity: number;
}

/** A transfer request (planning stage). */
export interface TransferRequest {
  _id: string;
  fromLocationId: string;
  toLocationId: string;
  requestedBy: string;
  status: TransferRequestStatus;
  items: TransferRequestItem[];
  notes?: string;
  neededBy?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Instance-level item in a physical transfer. */
export interface TransferItem {
  instanceId: string;
  sentCondition?: TransferCondition;
  receivedCondition?: TransferCondition;
  notes?: string;
}

/** Per-item received condition for marking a transfer as received. */
export interface ReceiveTransferItem {
  instanceId: string;
  receivedCondition: TransferCondition;
}

export interface Transfer {
  _id: string;
  requestId?: string;
  fromLocationId: string;
  toLocationId: string;
  items: TransferItem[];
  senderNotes?: string;
  receiverNotes?: string;
  status: TransferStatus;
  traceabilityEvents?: MaterialTraceabilityEvent[];
  createdAt: string;
  updatedAt?: string;
}

/** Payload to create a transfer request. */
export interface CreateTransferRequestPayload {
  fromLocationId: string;
  toLocationId: string;
  items: TransferRequestItem[];
  notes?: string;
}

/** Payload to respond to a transfer request. */
export interface RespondTransferRequestPayload {
  status: "approved" | "rejected";
}

/** Payload to update an existing transfer request. */
export interface UpdateTransferRequestPayload {
  items?: TransferRequestItem[];
  notes?: string;
  neededBy?: string;
}

/** Payload to initiate a physical transfer. */
export interface CreateTransferPayload {
  requestId?: string;
  fromLocationId: string;
  toLocationId: string;
  items: TransferItem[];
  senderNotes?: string;
}

/** Payload to mark a transfer as received. */
export interface ReceiveTransferPayload {
  receiverNotes?: string;
  items?: ReceiveTransferItem[];
}

/** Query params for listing transfer requests. */
export interface TransferRequestsQueryParams {
  status?: TransferRequestStatus;
  fulfilled?: boolean;
}

export interface TransfersQueryParams {
  status?: TransferStatus;
}

// ─── Pricing Configurations ────────────────────────────────────────────────

export type PricingStrategyType = "per_day" | "weekly_monthly" | "fixed";
export type PricingScope = "organization" | "materialType" | "package";

export interface PerDayParams {
  overridePricePerDay: number | null;
}

export interface WeeklyMonthlyParams {
  weeklyPrice: number;
  weeklyThreshold: number;
  monthlyPrice: number;
  monthlyThreshold: number;
}

export interface FixedParams {
  flatPrice: number;
}

export interface PricingConfig {
  _id: string;
  organizationId: string;
  scope: PricingScope;
  referenceId: string;
  strategyType: PricingStrategyType;
  isActive: boolean;
  perDayParams: PerDayParams | null;
  weeklyMonthlyParams: WeeklyMonthlyParams | null;
  fixedParams: FixedParams | null;
}

export interface CreatePricingConfigPayload {
  scope: PricingScope;
  referenceId: string;
  strategyType: PricingStrategyType;
  perDayParams?: PerDayParams;
  weeklyMonthlyParams?: WeeklyMonthlyParams;
  fixedParams?: FixedParams;
}

export interface UpdatePricingConfigPayload {
  strategyType?: PricingStrategyType;
  isActive?: boolean;
  perDayParams?: PerDayParams;
  weeklyMonthlyParams?: WeeklyMonthlyParams;
  fixedParams?: FixedParams;
}

export interface PricingPreviewParams {
  itemType: "material" | "package";
  referenceId: string;
  quantity: number;
  durationInDays: number;
}

export interface PricingPreviewResult {
  strategyType: PricingStrategyType;
  durationInDays: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  effectivePricePerDay: number;
}

// ─── Package Availability ──────────────────────────────────────────────────

export interface PackageAvailabilityInstance {
  instanceId: string;
  serialNumber: string;
  status: MaterialInstanceStatus;
  available: boolean;
}

export interface PackageAvailabilityItem {
  materialTypeId: string;
  materialTypeName: string;
  requiredQuantity: number;
  availableQuantity: number;
  fulfilled: boolean;
  instances: PackageAvailabilityInstance[];
}

export interface PackageAvailabilityResponse {
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string;
  fullyAvailable: boolean;
  items: PackageAvailabilityItem[];
}

// ─── Org-Level Analytics ───────────────────────────────────────────────────

export interface OrgAnalyticsOverview {
  totalCustomers: number;
  activeLoans: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdueLoans: number;
  materialsInUse: number;
  totalMaterialTypes: number;
  totalInstances: number;
}

export interface OrgMaterialUsage {
  materialTypeId: string;
  materialTypeName: string;
  totalInstances: number;
  inUse: number;
  available: number;
  utilization: number;
}

export interface OrgAnalyticsMaterials {
  usage: OrgMaterialUsage[];
  totalUtilization: number;
}

export interface OrgRevenueByMonth {
  period: string;
  revenue: number;
  invoiceCount: number;
}

export interface OrgAnalyticsRevenue {
  totalRevenue: number;
  monthlyTrend: OrgRevenueByMonth[];
  averageInvoiceAmount: number;
}

export interface OrgTopCustomer {
  customerId: string;
  customerName: string;
  totalLoans: number;
  totalSpent: number;
  activeLoans: number;
}

export interface OrgAnalyticsCustomers {
  totalCustomers: number;
  activeCustomers: number;
  topCustomers: OrgTopCustomer[];
}

// ─── Reports ───────────────────────────────────────────────────────────────

export interface ReportsQueryParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  locationId?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface ReportLoanEntry {
  loanId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  materialCount: number;
  depositAmount: number;
}

export interface ReportsLoansResponse {
  loans: ReportLoanEntry[];
  summary: {
    total: number;
    active: number;
    overdue: number;
    returned: number;
  };
  pagination: PaginationMeta;
}

export interface ReportInventoryEntry {
  materialTypeId: string;
  materialTypeName: string;
  totalInstances: number;
  available: number;
  loaned: number;
  maintenance: number;
  damaged: number;
}

export interface ReportsInventoryResponse {
  inventory: ReportInventoryEntry[];
  summary: {
    totalTypes: number;
    totalInstances: number;
    totalAvailable: number;
    totalLoaned: number;
  };
}

export interface ReportFinancialEntry {
  period: string;
  invoiceCount: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface ReportsFinancialResponse {
  entries: ReportFinancialEntry[];
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueCount: number;
  };
}

export interface ReportDamageEntry {
  inspectionId: string;
  loanId: string;
  customerName: string;
  materialName: string;
  condition: InspectionCondition;
  damageCost: number;
  date: string;
}

export interface ReportsDamagesResponse {
  damages: ReportDamageEntry[];
  summary: {
    totalDamages: number;
    totalCost: number;
    lostCount: number;
    damagedCount: number;
  };
  pagination: PaginationMeta;
}

export interface ReportTransferEntry {
  transferId: string;
  fromLocation: string;
  toLocation: string;
  itemCount: number;
  status: TransferStatus;
  date: string;
}

export interface ReportsTransfersResponse {
  transfers: ReportTransferEntry[];
  summary: {
    total: number;
    inTransit: number;
    completed: number;
    cancelled: number;
  };
  pagination: PaginationMeta;
}

// ─── Reports (API-aligned interfaces) ──────────────────────────────────────

/** Loan item as returned by GET /reports/loans */
export interface ReportLoanItem {
  loanId: string;
  customer: {
    _id: string;
    name: {
      firstName: string;
      secondName?: string;
      firstSurname: string;
      secondSurname?: string;
    };
    email: string;
    documentNumber: string;
  };
  status: string;
  startDate: string;
  endDate: string;
  returnedAt: string | null;
  durationDays: number;
  overdueDays: number;
  totalAmount: number;
  depositAmount: number;
  depositStatus: string;
  materialCount: number;
}

/** Full response shape for GET /reports/loans */
export interface ReportsLoansData {
  rows: ReportLoanItem[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    totalLoans: number;
    totalRevenue: number;
    averageDurationDays: number;
  };
}

/** Material-type breakdown item from GET /reports/inventory */
export interface ReportInventoryByMaterialType {
  _id: string;
  total: number;
  statuses: Array<{ status: string; count: number }>;
  materialTypeId: string;
  materialTypeName: string;
}

/** Location breakdown item from GET /reports/inventory */
export interface ReportInventoryByLocation {
  _id: string;
  total: number;
  statuses: Array<{ status: string; count: number }>;
  locationId: string;
  locationName: string;
}

/** Full response shape for GET /reports/inventory */
export interface ReportsInventoryData {
  totalInstances: number;
  byMaterialType: ReportInventoryByMaterialType[];
  byLocation: ReportInventoryByLocation[];
}

/** Invoice item as returned by GET /reports/financial */
export interface ReportFinancialInvoice {
  invoiceId: string;
  customer: {
    name: {
      firstName: string;
      secondName?: string;
      firstSurname: string;
      secondSurname?: string;
    };
    email: string;
  };
  type: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  createdAt: string;
  dueDate: string;
}

/** Full response shape for GET /reports/financial */
export interface ReportsFinancialData {
  rows: ReportFinancialInvoice[];
  total: number;
  page: number;
  totalPages: number;
  summaryByType: Array<{
    type: string;
    totalAmount: number;
    totalPaid: number;
    totalDue: number;
    count: number;
  }>;
  summaryByStatus: Array<{ status: string; totalAmount: number; count: number }>;
}

/** Damage item as returned by GET /reports/damages */
export interface ReportDamageItem {
  inspectionId: string;
  loanId: string;
  customer: { name: string };
  inspectedAt: string;
  item: {
    materialInstanceId: string;
    conditionBefore: string;
    conditionAfter: string;
    damageDescription: string;
    chargeToCustomer: number;
    estimatedRepairCost: number;
  };
}

/** Full response shape for GET /reports/damages */
export interface ReportsDamagesData {
  damages: ReportDamageItem[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    totalDamages: number;
    totalCharges: number;
    totalRepairCost: number;
  };
}

/** Transfer item as returned by GET /reports/transfers */
export interface ReportTransferItem {
  _id: string;
  fromLocation: { name: string };
  toLocation: { name: string };
  status: string;
  items: unknown[];
  notes: string;
  createdAt: string;
}

/** Full response shape for GET /reports/transfers */
export interface ReportsTransfersData {
  transfers: ReportTransferItem[];
  total: number;
  page: number;
  totalPages: number;
  summaryByStatus: Array<{ _id: string; count: number }>;
}

// ─── Report Exports ────────────────────────────────────────────────────────

/** Base query params shared by all /reports/exports/* endpoints. */
export interface ExportBaseQueryParams {
  startDate?: string;
  endDate?: string;
  includeIds?: boolean;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

/** Standard pagination object returned by export endpoints. */
export interface ExportPagination {
  total: number;
  page: number;
  totalPages: number;
}

// ── Loan Activity (/reports/exports/loan-activity) ─────────────────────────

export interface ExportLoanActivityParams extends ExportBaseQueryParams {
  customerId?: string;
  locationId?: string;
  status?: string;
}

export interface ExportLoanActivityRow {
  loanId?: string;
  customerId?: string;
  locationId?: string;
  code: string;
  customerName: string;
  locationName: string;
  status: string;
  startDate: string;
  endDate: string;
  returnedAt: string | null;
  durationDays: number;
  overdueDays: number;
  totalAmount: number;
  materialCount: number;
}

export interface ExportLoanActivityPeriodComparison {
  currentCount: number;
  previousCount: number;
  percentChange: number;
  currentRevenue: number;
  previousRevenue: number;
  revenuePercentChange: number;
}

export interface ExportLoanActivitySummary {
  totalLoans: number;
  totalRevenue: number;
  averageDurationDays: number;
  overdueRate: number;
  returnRate: number;
  loansByMonth: Array<{ year: number; month: number; count: number; totalAmount: number }>;
  loansByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  topMaterials: Array<{ materialName: string; loanCount: number }>;
  topCustomers: Array<{ customerName: string; loanCount: number; totalAmount: number }>;
  periodComparison?: ExportLoanActivityPeriodComparison;
}

export interface ExportLoanActivityData {
  rows: ExportLoanActivityRow[];
  pagination: ExportPagination;
  summary?: ExportLoanActivitySummary;
}

// ── Sales (/reports/exports/sales) ─────────────────────────────────────────

export interface ExportSalesParams extends ExportBaseQueryParams {
  customerId?: string;
  locationId?: string;
  invoiceType?: string;
  invoiceStatus?: string;
  categoryId?: string;
}

export interface ExportSalesLoanRow {
  loanId?: string;
  customerId?: string;
  locationId?: string;
  code: string;
  customerName: string;
  customerEmail: string;
  locationName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  depositAmount: number;
  status: string;
  materialCount: number;
}

export interface ExportSalesInvoiceRow {
  invoiceId?: string;
  customerId?: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customerName: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  createdAt: string;
}

export interface ExportSalesPeriodComparison {
  currentTotal: number;
  previousTotal: number;
  percentChange: number;
}

export interface ExportSalesSummary {
  totalLoanRevenue: number;
  totalInvoiceRevenue: number;
  combinedRevenue: number;
  averageLoanValue: number;
  revenueByMonth: Array<{
    year: number;
    month: number;
    loanRevenue: number;
    invoiceRevenue: number;
    total: number;
  }>;
  revenueByInvoiceType: Array<{ type: string; revenue: number; count: number }>;
  topCustomersByRevenue: Array<{ customerName: string; totalRevenue: number; loanCount: number }>;
  periodComparison?: ExportSalesPeriodComparison;
}

export interface ExportSalesData {
  loanRows: ExportSalesLoanRow[];
  invoiceRows: ExportSalesInvoiceRow[];
  pagination: ExportPagination;
  summary?: ExportSalesSummary;
}

// ── Inventory (/reports/exports/inventory) ─────────────────────────────────

export interface ExportInventoryParams {
  includeIds?: boolean;
  locationId?: string;
  categoryId?: string;
  status?: string;
  search?: string;
}

export interface ExportInventoryMaterialType {
  materialTypeId?: string;
  categoryIds?: string[];
  code: string;
  name: string;
  description: string;
  pricePerDay: number;
  categoryNames: string[];
  totalInstances: number;
  instancesByStatus: Record<string, number>;
  locationBreakdown: Array<{
    locationName: string;
    locationId?: string;
    count: number;
  }>;
  utilizationRate?: number;
  availabilityRate?: number;
  damageRate?: number;
  totalRevenue?: number;
  totalLoans?: number;
  averageLoanDurationDays?: number;
  maintenanceCostTotal?: number;
}

export interface ExportInventoryLocation {
  locationId?: string;
  locationName: string;
  totalInstances: number;
  instancesByStatus: Record<string, number>;
}

export interface ExportInventorySummary {
  totalCatalogItems: number;
  totalInstances: number;
  totalMaterialTypes: number;
  totalLocations: number;
  globalInstancesByStatus: Array<{ status: string; count: number }>;
  globalAvailabilityRate: number;
  globalUtilizationRate: number;
  damageRate: number;
  maintenanceRate: number;
  estimatedDailyValue: number;
  topMaterialTypesByStock: Array<{ name: string; total: number }>;
  topLocationsByStock: Array<{ name: string; total: number }>;
}

export interface ExportInventoryData {
  exportedAt: string;
  totalMaterialTypes: number;
  totalInstances: number;
  materialTypes: ExportInventoryMaterialType[];
  byMaterialType: ExportInventoryMaterialType[];
  byLocation: ExportInventoryLocation[];
  summary?: ExportInventorySummary;
}

// ── Damages (/reports/exports/damages) ─────────────────────────────────────

export interface ExportDamagesParams extends ExportBaseQueryParams {
  locationId?: string;
  batchStatus?: string;
  entryReason?: string;
}

export interface ExportDamagesBatch {
  batchId?: string;
  locationId?: string;
  batchNumber: string;
  name: string;
  status: string;
  locationName: string;
  assignedTo: string;
  totalEstimatedCost: number;
  totalActualCost: number;
  startedAt: string;
  completedAt: string | null;
  itemCount: number;
}

export interface ExportDamagesItem {
  materialInstanceId?: string;
  batchNumber: string;
  serialNumber: string;
  materialTypeName: string;
  entryReason: string;
  itemStatus: string;
  estimatedCost: number;
  actualCost: number;
  repairNotes: string;
  sourceType: string;
  resolvedAt: string | null;
}

export interface ExportDamagesPeriodComparison {
  currentCost: number;
  previousCost: number;
  percentChange: number;
  currentItemCount: number;
  previousItemCount: number;
  itemCountPercentChange: number;
}

export interface ExportDamagesSummary {
  totalBatches: number;
  totalItems: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  costVariance: number;
  costVariancePercent: number;
  costByEntryReason: Array<{
    reason: string;
    estimatedCost: number;
    actualCost: number;
    itemCount: number;
  }>;
  costByMonth: Array<{
    year: number;
    month: number;
    estimatedCost: number;
    actualCost: number;
    batchCount: number;
  }>;
  mostDamagedMaterials: Array<{
    materialTypeName: string;
    incidentCount: number;
    totalCost: number;
  }>;
  averageRepairTimeDays: number;
  resolutionBreakdown: Array<{ status: string; count: number }>;
  periodComparison?: ExportDamagesPeriodComparison;
}

export interface ExportDamagesData {
  batches: ExportDamagesBatch[];
  items: ExportDamagesItem[];
  pagination: ExportPagination;
  summary?: ExportDamagesSummary;
}

// ── Transfers (/reports/exports/transfers) ─────────────────────────────────

export interface ExportTransfersParams extends ExportBaseQueryParams {
  status?: string;
  fromLocationId?: string;
  toLocationId?: string;
}

export interface ExportTransferRow {
  transferId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  status: string;
  fromLocation: string;
  toLocation: string;
  itemCount: number;
  pickedBy: string;
  receivedBy: string;
  sentAt: string;
  receivedAt: string | null;
  transitDays: number;
  senderNotes: string | null;
  receiverNotes: string | null;
  createdAt: string;
}

export interface ExportTransfersPeriodComparison {
  currentTransfers: number;
  previousTransfers: number;
  percentChange: number;
  currentItems: number;
  previousItems: number;
  itemsPercentChange: number;
}

export interface ExportTransfersSummary {
  totalTransfers: number;
  totalItemsMoved: number;
  averageTransitDays: number;
  completionRate: number;
  issueRate: number;
  transfersByStatus: Array<{ status: string; count: number; totalItems: number }>;
  transfersByMonth: Array<{ year: number; month: number; count: number; totalItems: number }>;
  receivedConditionBreakdown: Array<{ condition: string; count: number }>;
  topRoutes: Array<{
    fromLocation: string;
    toLocation: string;
    transferCount: number;
    totalItems: number;
  }>;
  periodComparison?: ExportTransfersPeriodComparison;
}

export interface ExportTransfersData {
  rows: ExportTransferRow[];
  pagination: ExportPagination;
  summary?: ExportTransfersSummary;
}

// ── Customers (/reports/exports/customers) ─────────────────────────────────

export interface ExportCustomersParams extends ExportBaseQueryParams {
  status?: string;
}

export interface ExportCustomersRow {
  customerId?: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  status: string;
  totalLoans: number;
  activeLoans: number;
  totalRevenue: number;
  avgLoanAmount: number;
  lastLoanAt: string | null;
  createdAt: string;
}

export interface ExportCustomersPeriodComparison {
  currentNewCustomers: number;
  previousNewCustomers: number;
  percentChange: number;
}

export interface ExportCustomersSummary {
  totalCustomers: number;
  byStatus: Array<{ status: string; count: number }>;
  totalRevenue: number;
  totalLoans: number;
  topByRevenue: Array<{ fullName: string; totalRevenue: number }>;
  topByLoanCount: Array<{ fullName: string; loanCount: number }>;
  periodComparison?: ExportCustomersPeriodComparison;
}

/** Raw shape returned by the API (customers array + flat pagination). */
export interface ExportCustomersRawData {
  total: number;
  page: number;
  limit: number;
  customers: ExportCustomersRow[];
  summary?: ExportCustomersSummary;
}

/** Normalised shape consumed by the rest of the app. */
export interface ExportCustomersData {
  rows: ExportCustomersRow[];
  pagination: ExportPagination;
  summary?: ExportCustomersSummary;
}

// ── Locations (/reports/exports/locations) ─────────────────────────────────

export interface ExportLocationsParams extends ExportBaseQueryParams {
  status?: string;
}

export interface ExportLocationsRow {
  locationId?: string;
  name: string;
  code: string;
  status: string;
  isActive: boolean;
  address: {
    streetType: string;
    primaryNumber: string;
    secondaryNumber: string;
    complementaryNumber: string;
    department: string;
    city: string;
    country: string;
  };
  additionalDetails: string | null;
  materialCapacitiesSummary: {
    totalCapacity: number;
    totalOccupied: number;
    occupancyRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExportLocationsPeriodComparison {
  currentLocations: number;
  previousLocations: number;
  percentChange: number;
}

export interface ExportLocationsSummary {
  totalLocations: number;
  byStatus: Array<{ status: string; count: number }>;
  byActive: { active: number; inactive: number };
  avgOccupancyRate: number;
  totalCapacity: number;
  totalOccupied: number;
  topByOccupancy: Array<{ name: string; code: string; occupancyRate: number }>;
  periodComparison?: ExportLocationsPeriodComparison;
}

/** Raw shape returned by the API (locations array + totalLocations). */
export interface ExportLocationsRawData {
  totalLocations: number;
  locations: ExportLocationsRow[];
  summary?: ExportLocationsSummary;
}

/** Normalised shape consumed by the rest of the app. */
export interface ExportLocationsData {
  rows: ExportLocationsRow[];
  pagination: ExportPagination;
  summary?: ExportLocationsSummary;
}

// ── Loan Requests (/reports/exports/requests) ─────────────────────────

export interface ExportRequestsParams extends ExportBaseQueryParams {
  status?: string;
}

export interface ExportRequestsRow {
  requestId?: string;
  code: string;
  status: string;
  itemCount: number;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  depositAmount: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface ExportRequestsFunnel {
  approvalRate: number;
  completionRate: number;
  rejectionRate: number;
  cancellationRate: number;
  avgApprovalTimeHours: number;
}

export interface ExportRequestsPeriodComparison {
  currentRequests: number;
  previousRequests: number;
  percentChange: number;
}

export interface ExportRequestsSummary {
  totalRequests: number;
  byStatus: Array<{ status: string; count: number }>;
  byMonth: Array<{ year: number; month: number; count: number; totalAmount: number }>;
  funnel: ExportRequestsFunnel;
  avgRequestValue: number;
  avgDuration: number;
  totalRevenue: number;
  periodComparison?: ExportRequestsPeriodComparison;
}

/** Raw shape returned by the API (requests array + flat pagination). */
export interface ExportRequestsRawData {
  total: number;
  page: number;
  limit: number;
  requests: ExportRequestsRow[];
  summary?: ExportRequestsSummary;
}

/** Normalised shape consumed by the rest of the app. */
export interface ExportRequestsData {
  rows: ExportRequestsRow[];
  pagination: ExportPagination;
  summary?: ExportRequestsSummary;
}

// ── Billing History (/reports/exports/billing-history) ─────────────────────

export interface ExportBillingHistoryParams extends ExportBaseQueryParams {
  eventType?: string;
}

export interface ExportBillingHistoryRow {
  eventType: string;
  amount: number | null;
  currency: string;
  previousPlan: string | null;
  newPlan: string | null;
  seatChange: number | null;
  processed: boolean;
  error: string | null;
  createdAt: string;
}

export interface ExportBillingHistoryCurrentSubscription {
  plan: string;
  seatCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pendingPlan: string | null;
  pendingPlanEffectiveDate: string | null;
}

export interface ExportBillingHistoryPeriodComparison {
  currentEvents: number;
  previousEvents: number;
  eventsPercentChange: number;
  currentAmountPaid: number;
  previousAmountPaid: number;
  amountPercentChange: number;
}

export interface ExportBillingHistorySummary {
  totalEvents: number;
  eventsByType: Array<{ eventType: string; count: number }>;
  eventsByMonth: Array<{ year: number; month: number; count: number; totalAmount: number }>;
  paymentSummary: Array<{
    currency: string;
    totalPaid: number;
    paymentCount: number;
    averagePayment: number;
  }>;
  paymentSuccessRate: number;
  failedPaymentCount: number;
  planChangeHistory: Array<{
    eventType: string;
    previousPlan: string;
    newPlan: string;
    seatChange: number;
    createdAt: string;
  }>;
  periodComparison?: ExportBillingHistoryPeriodComparison;
}

export interface ExportBillingHistoryData {
  currentSubscription: ExportBillingHistoryCurrentSubscription;
  rows: ExportBillingHistoryRow[];
  pagination: ExportPagination;
  summary?: ExportBillingHistorySummary;
}

// ─── Location Operations (Warehouse Operator Dashboard) ────────────────────

/** Priority levels for operational tasks. */
export type OpsTaskPriority = "critical" | "high" | "medium" | "low";

/** Task type identifiers returned by the unified tasks endpoint. */
export type OpsTaskType =
  | "overdue_loan"
  | "expiring_loan"
  | "overdue_invoice"
  | "pending_inspection"
  | "damaged_item"
  | "maintenance_item"
  | "lost_item"
  | "inbound_transfer"
  | "pending_transfer_request"
  | "pending_damage_assessment"
  | "pending_repair"
  | "pending_billing";

/** KPI snapshot from GET /locations/:id/operations/overview */
export interface OpsOverview {
  inventory: {
    itemsInRepair: number;
    itemsPendingInspection: number;
    itemsMissing: number;
    itemsDamaged: number;
  };
  loans: {
    active: number;
    dueToday: number;
    overdue: number;
    returnPendingInspection: number;
  };
  financials: {
    overdueInvoices: number;
    pendingDepositsToRefund: number;
    unresolvedDamageCharges: number;
  };
  transfers: {
    incomingPending: number;
    outgoingPending: number;
    transfersInTransit: number;
  };
  alerts: unknown[];
}

/** Individual inspection item in the queue. */
export interface OpsInspectionItem {
  _id: string;
  loanId: string;
  loanCode?: string;
  instanceId: string;
  materialTypeName: string;
  serialNumber: string;
  returnedAt: string;
  timeWaitingMinutes: number;
  loanEndDate: string;
  customerName: string;
  priority: "low" | "medium" | "high";
}

/** Flat inspection queue from GET /locations/:id/operations/inspections */
export type OpsInspectionsResponse = OpsInspectionItem[];

/** Overdue invoice entry from GET /locations/:id/operations/financials/overdue */
export interface OpsOverdueInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

export interface OpsOverdueFinancialsResponse {
  invoices: OpsOverdueInvoice[];
  totalOverdue: number;
  totalAmount: number;
}

/** Inventory issue from GET /locations/:id/operations/inventory/issues */
export interface OpsInventoryIssue {
  instanceId: string;
  serialNumber: string;
  materialTypeId: string;
  materialTypeName: string;
  category: "damaged" | "maintenance" | "lost";
  since: string;
}

export interface OpsInventoryIssuesResponse {
  damaged: OpsInventoryIssue[];
  maintenance: OpsInventoryIssue[];
  lost: OpsInventoryIssue[];
  total: number;
}

/** Transfer entry in the queue from GET /locations/:id/operations/transfers */
export interface OpsTransferEntry {
  transferId: string;
  requestId?: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  itemCount: number;
  status: TransferStatus | TransferRequestStatus;
  createdAt: string;
}

export interface OpsTransfersResponse {
  inbound: OpsTransferEntry[];
  pendingRequests: OpsTransferEntry[];
  total: number;
}

/** Loan deadline entry from GET /locations/:id/operations/loans/deadlines */
export interface OpsLoanDeadline {
  loanId: string;
  customerId: string;
  customerName: string;
  endDate: string;
  materialCount: number;
  isOverdue: boolean;
  hoursRemaining: number;
}

export interface OpsLoanDeadlinesResponse {
  overdue: OpsLoanDeadline[];
  dueSoon: OpsLoanDeadline[];
  total: number;
}

/** Damage resolution item from GET /locations/:id/operations/damages */
export interface OpsDamageItem {
  inspectionId: string;
  instanceId: string;
  serialNumber: string;
  materialTypeName: string;
  condition: InspectionCondition;
  customerName: string;
  inspectionDate: string;
  estimatedCost?: number;
}

export interface OpsDamagesResponse {
  pendingAssessment: OpsDamageItem[];
  pendingRepair: OpsDamageItem[];
  pendingBilling: OpsDamageItem[];
  total: number;
}

/** Unified task from GET /locations/:id/operations/tasks */
export interface OpsTask {
  id: string;
  type: OpsTaskType;
  priority: OpsTaskPriority;
  title: string;
  description: string;
  referenceId: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
}

export interface OpsTasksResponse {
  tasks: OpsTask[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

// ─── Catalog Overview ──────────────────────────────────────────────────────

/** Query parameters for GET /materials/catalog/overview. */
export interface CatalogOverviewQueryParams {
  locationId?: string;
  categoryId?: string;
  materialTypeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Org-wide summary metrics from catalog overview. */
export interface CatalogOverviewSummary {
  totalMaterialTypes: number;
  totalInstances: number;
  globalAvailabilityRate: number;
  globalUtilizationRate: number;
  materialTypesWithLowStock: number;
  materialTypesWithHighDamage: number;
}

/** Per-material-type instance count breakdown by status. */
export interface CatalogMaterialTypeTotals {
  totalInstances: number;
  available: number;
  reserved: number;
  loaned: number;
  inUse: number;
  returned: number;
  maintenance: number;
  damaged: number;
  lost: number;
  retired: number;
}

/** Per-material-type operational metrics (rates 0–1). */
export interface CatalogMaterialTypeMetrics {
  availabilityRate: number;
  utilizationRate: number;
  damageRate: number;
  repairRate: number;
  reservationPressure: number;
}

/** Alert type constants from the catalog overview endpoint. */
export type CatalogAlertType =
  | "LOW_STOCK"
  | "HIGH_UTILIZATION"
  | "HIGH_DAMAGE_RATE"
  | "OVER_RESERVED";

/** Severity levels for catalog alerts. */
export type CatalogAlertSeverity = "high" | "medium";

/** An operational alert attached to a material type. */
export interface CatalogMaterialTypeAlert {
  type: CatalogAlertType;
  severity: CatalogAlertSeverity;
}

/** Category reference within a catalog overview material type. */
export interface CatalogCategoryRef {
  categoryId: string;
  name: string;
}

/** A material type entry in the catalog overview response. */
export interface CatalogMaterialType {
  materialTypeId: string;
  name: string;
  pricePerDay: number;
  categories: CatalogCategoryRef[];
  totals: CatalogMaterialTypeTotals;
  metrics: CatalogMaterialTypeMetrics;
  alerts: CatalogMaterialTypeAlert[];
}

/** Full response payload from GET /materials/catalog/overview. */
export interface CatalogOverviewResponse {
  summary: CatalogOverviewSummary;
  materialTypes: CatalogMaterialType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Code Schemes ──────────────────────────────────────────────────────────

/** The entity types a code scheme can target. */
export type CodeSchemeEntityType =
  | "loan"
  | "loan_request"
  | "invoice"
  | "inspection"
  | "incident"
  | "maintenance_batch"
  | "material_instance";

/** A code scheme returned by the API. */
export interface CodeScheme {
  _id: string;
  organizationId: string;
  entityType: CodeSchemeEntityType;
  name: string;
  pattern: string;
  isActive: boolean;
  isDefault: boolean;
  /** Only for material_instance — scoped to a specific material type. */
  materialTypeId: string | null;
  /** Only for material_instance — scoped to a specific category. */
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for POST /code-schemes. */
export interface CreateCodeSchemePayload {
  entityType: CodeSchemeEntityType;
  name: string;
  pattern: string;
  isActive?: boolean;
  isDefault?: boolean;
  /** Only for material_instance — scoped to a specific material type. */
  materialTypeId?: string;
  /** Only for material_instance — scoped to a specific category. */
  categoryId?: string;
}

/** Payload for PUT /code-schemes/:id. Cannot change entityType. */
export interface UpdateCodeSchemePayload {
  name?: string;
  pattern?: string;
  isActive?: boolean;
}

/** Query parameters for GET /code-schemes. */
export interface CodeSchemesQueryParams {
  entityType?: CodeSchemeEntityType;
}

// ─── Admin Export Types ─────────────────────────────────────────────────────

// --- Platform KPIs ---

export interface AdminExportPlatformKpisParams {
  startDate?: string;
  endDate?: string;
  includeIds?: boolean;
}

export interface AdminPlatformKpisMonthlyRow {
  year: number;
  month: number;
  newOrgs: number;
  newUsers: number;
  totalLoans: number;
  totalInvoices: number;
}

export interface AdminPlatformKpisCurrentKpis {
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  activeUsers: number;
  totalLoans: number;
  totalInvoices: number;
  mrr: number;
  arr: number;
}

export interface AdminPlatformKpisPeriodComparison {
  previous: { orgs: number; users: number; loans: number; invoices: number };
  current: { orgs: number; users: number; loans: number; invoices: number };
  changes: { orgs: number; users: number; loans: number; invoices: number };
}

export interface AdminPlatformKpisSummary {
  currentKpis: AdminPlatformKpisCurrentKpis;
  avgUsersPerOrg: number;
  avgSeatsPerOrg: number;
  avgCatalogItemsPerOrg: number;
  orgsByStatus: Record<string, number>;
  usersByStatus: Record<string, number>;
  periodComparison?: AdminPlatformKpisPeriodComparison;
}

export interface AdminPlatformKpisDetailData {
  monthlyBreakdown: AdminPlatformKpisMonthlyRow[];
  generatedAt: string;
}

export interface AdminPlatformKpisSummaryData {
  summary: AdminPlatformKpisSummary;
  generatedAt: string;
}

// --- Subscriptions ---

export interface AdminExportSubscriptionsParams {
  startDate?: string;
  endDate?: string;
  plan?: string;
  orgStatus?: string;
  page?: number;
  limit?: number;
  includeIds?: boolean;
}

export interface AdminSubscriptionRow {
  orgId: string;
  orgName: string;
  orgStatus: string;
  plan: string;
  seatCount: number;
  catalogItemCount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  pendingPlan: string | null;
  orgCreatedAt: string;
}

export interface AdminSubscriptionsPlanBreakdown {
  plan: string;
  count: number;
  percentage: number;
  estimatedMonthlyRevenue: number;
}

export interface AdminSubscriptionsPeriodComparison {
  previous: { orgs: number; churn: number; upgrades: number; downgrades: number };
  current: { orgs: number; churn: number; upgrades: number; downgrades: number };
  changes: { orgs: number; churn: number; upgrades: number; downgrades: number };
}

export interface AdminSubscriptionsSummary {
  totalOrgs: number;
  byPlan: AdminSubscriptionsPlanBreakdown[];
  byOrgStatus: Array<{ status: string; count: number }>;
  churn: number;
  upgrades: number;
  downgrades: number;
  paymentAnalytics: {
    succeeded: number;
    failed: number;
    successRate: number;
  };
  topPlanByCount: { plan: string; count: number };
  topPlanByRevenue: { plan: string; revenue: number };
  periodComparison?: AdminSubscriptionsPeriodComparison;
}

export interface AdminSubscriptionsDetailData {
  subscriptions: AdminSubscriptionRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  generatedAt: string;
}

export interface AdminSubscriptionsSummaryData {
  summary: AdminSubscriptionsSummary;
  generatedAt: string;
}

// --- Usage ---

export interface AdminExportUsageParams {
  startDate?: string;
  endDate?: string;
  plan?: string;
  orgStatus?: string;
  page?: number;
  limit?: number;
  includeIds?: boolean;
}

export interface AdminUsageOrgRow {
  orgId: string;
  orgName: string;
  plan: string;
  orgStatus: string;
  userCount: number;
  activeUserCount: number;
  loanCount: number;
  invoiceCount: number;
  customerCount: number;
  locationCount: number;
  materialTypeCount: number;
  materialInstanceCount: number;
  createdAt: string;
}

export interface AdminUsagePlatformTotals {
  organizations: number;
  users: number;
  loans: number;
  invoices: number;
  customers: number;
  locations: number;
  materialTypes: number;
  materialInstances: number;
}

export interface AdminUsagePeriodComparison {
  previous: { loans: number; invoices: number; users: number; customers: number };
  current: { loans: number; invoices: number; users: number; customers: number };
  changes: { loans: number; invoices: number; users: number; customers: number };
}

export interface AdminUsageSummary {
  platformTotals: AdminUsagePlatformTotals;
  avgPerOrg: {
    users: number;
    loans: number;
    invoices: number;
    customers: number;
  };
  topByLoans: Array<{ orgName: string; plan: string; count: number }>;
  topByInvoices: Array<{ orgName: string; plan: string; count: number }>;
  topByUsers: Array<{ orgName: string; plan: string; count: number }>;
  usageDistribution: Array<{ bucket: string; orgCount: number }>;
  periodComparison?: AdminUsagePeriodComparison;
}

export interface AdminUsageDetailData {
  organizations: AdminUsageOrgRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  generatedAt: string;
}

export interface AdminUsageSummaryData {
  summary: AdminUsageSummary;
  generatedAt: string;
}

// ─── Tickets (Solicitudes de Usuario) ─────────────────────────────────────

export type TicketType =
  | "transfer_request"
  | "incident_report"
  | "maintenance_request"
  | "inspection_request"
  | "generic";

export type TicketStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type TicketSeverity = "low" | "medium" | "high" | "critical";

export type TicketIncidentContext = "transit" | "storage" | "loan" | "maintenance" | "other";

export type TicketMaintenanceEntryReason = "damaged" | "other";

/** Payload for ticket type `transfer_request`. */
export interface TicketTransferRequestPayload {
  toLocationId: string;
  items: Array<{ materialTypeId: string; quantity: number }>;
  neededBy?: string;
}

/** Payload for ticket type `incident_report`. */
export interface TicketIncidentReportPayload {
  materialInstanceIds?: string[];
  loanId?: string;
  severity: TicketSeverity;
  context: TicketIncidentContext;
  description?: string;
}

/** Payload for ticket type `maintenance_request`. */
export interface TicketMaintenanceRequestPayload {
  materialInstanceIds: string[];
  entryReason: TicketMaintenanceEntryReason;
  estimatedCost?: number;
  notes?: string;
}

/** Payload for ticket type `inspection_request`. */
export interface TicketInspectionRequestPayload {
  loanId: string;
  notes?: string;
}

/** Payload for ticket type `generic`. */
export interface TicketGenericPayload {
  details: string;
}

/** Discriminated union of all ticket payload shapes. */
export type TicketPayload =
  | TicketTransferRequestPayload
  | TicketIncidentReportPayload
  | TicketMaintenanceRequestPayload
  | TicketInspectionRequestPayload
  | TicketGenericPayload;

/** Full ticket entity returned by GET /tickets/:id. */
export interface Ticket {
  _id: string;
  organizationId: string;
  locationId: string;
  type: TicketType;
  status: TicketStatus;
  title: string;
  description?: string;
  createdBy: string;
  assigneeId?: string;
  responseDeadline?: string;
  payload: TicketPayload;
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** Slim ticket item returned in GET /tickets list responses. */
export interface TicketListItem {
  _id: string;
  type: TicketType;
  status: TicketStatus;
  title: string;
  createdBy: string;
  locationId: string;
  createdAt: string;
}

/** Query parameters for GET /tickets. */
export interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  type?: TicketType;
  locationId?: string;
}

/** Body for POST /tickets. */
export interface CreateTicketPayload {
  locationId: string;
  type: TicketType;
  title: string;
  description?: string;
  assigneeId?: string;
  responseDeadline?: string;
  payload: TicketPayload;
}

/** Body for PATCH /tickets/:id/approve. */
export interface ApproveTicketPayload {
  resolutionNote?: string;
}

/** Body for PATCH /tickets/:id/reject. */
export interface RejectTicketPayload {
  resolutionNote: string;
}

/** A single user entry returned by GET /tickets/:id/capable-users. */
export interface TicketCapableUser {
  _id: string;
  name: { firstName: string; firstSurname: string };
  email: string;
  role: string;
}

/** Response data for GET /tickets/:id/capable-users. */
export interface TicketCapableUsersData {
  ticketType: TicketType;
  users: TicketCapableUser[];
}

/** Body for PATCH /tickets/:id — general ticket update (e.g. set assignee). */
export interface UpdateTicketPayload {
  assigneeId?: string;
}
