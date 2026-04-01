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
  description?: string;
  attributes: CategoryAttribute[];
  createdAt: string;
  updatedAt: string;
}

/** Payload to create a new material category. */
export interface CreateMaterialCategoryPayload {
  name: string;
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
  /** Date when the instance was created (ISO date string) */
  createdAt: string;
  /** Date when the instance was last updated (ISO date string) */
  updatedAt: string;
  /** Version key */
  __v: number;
}

export interface CreateMaterialInstancePayload {
  modelId: string;
  serialNumber: string;
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
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  items: PackageMaterialEntry[];
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
}

export interface LoanRequest {
  _id: string;
  customerId: string;
  items: LoanRequestItem[];
  startDate: string;
  endDate: string;
  status: LoanRequestStatus;
  notes?: string;
  depositAmount?: number;
  depositPaidAt?: string;
  totalAmount?: number;
  rentalFeePaidAt?: string;
  loanId?: string;
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

export type LoanStatus = "active" | "overdue" | "returned" | "closed";

export type DepositStatus =
  | "pending"
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

export interface Loan {
  _id: string;
  customerId: string | Customer;
  requestId: string;
  status: LoanStatus;
  startDate: string;
  endDate: string;
  notes?: string;
  deposit: {
    amount: number;
    status: DepositStatus;
    transactions: DepositTransaction[];
    refundAvailable?: boolean;
    refundableAmount?: number;
  };
}

/** Populated material instance entry returned by GET /loans/:id */
export interface LoanMaterialInstanceEntry {
  materialInstanceId: {
    _id: string;
    serialNumber: string;
    status: string;
    modelId: string;
    name: string;
  };
  materialTypeId: string;
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
  notes?: string;
}

// ─── Inspections ───────────────────────────────────────────────────────────

export type InspectionCondition = "good" | "damaged" | "lost";

export interface InspectionItem {
  materialInstanceId: string;
  condition: InspectionCondition;
  conditionBefore?: InspectionCondition;
  conditionDegraded?: boolean;
  notes?: string;
  damageDescription: string;
  damageCost?: number;
}

export interface Inspection {
  _id: string;
  loanId: string;
  items: InspectionItem[];
  overallNotes?: string;
}

export interface CreateInspectionPayload {
  loanId: string;
  items: InspectionItem[];
  overallNotes?: string;
  dueDate?: string;
}

export interface PendingLoan {
  _id: string;
  customerId: {
    _id: string;
    email: string;
    name: {
      firstName: string;
      firstSurname: string;
      secondName?: string;
      secondSurname?: string;
    };
  };
  materialInstances: {
    materialInstanceId: {
      _id: string;
      serialNumber: string;
    };
    materialTypeId: {
      _id: string;
      name: string;
    };
  }[];
  startDate: string;
  endDate: string;
  status: "returned";
}

// ─── Invoices ──────────────────────────────────────────────────────────────

export type InvoiceStatus = "draft" | "pending" | "paid" | "cancelled";
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
  paymentMethodId: string;
  reference?: string;
  recordedAt: string;
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

export interface InvoiceLoan {
  _id: string;
  startDate?: string;
  endDate?: string;
}

export interface Invoice {
  _id: string;
  organizationId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  type: InvoiceType;
  customerId: InvoiceCustomer | string;
  loanId?: InvoiceLoan | string;
  inspectionId?: string;
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

/** Permission */
export interface Permission {
  id: string;
  displayName: string;
  description: string;
  category: string;
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

// ─── Teams ─────────────────────────────────────────────────────────────────

export type TeamMemberStatus = "active" | "inactive";

/** Team entity */
export interface Team {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  leaderId?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Team member */
export interface TeamMember {
  userId: string;
  email: string;
  name: PersonName;
  roleName: string;
  joinedAt: string;
  status: TeamMemberStatus;
}

/** Payload to create a new team */
export interface CreateTeamPayload {
  name: string;
  description?: string;
  leaderId?: string;
}

/** Payload to update an existing team */
export interface UpdateTeamPayload {
  name?: string;
  description?: string;
  leaderId?: string;
  isActive?: boolean;
}

/** Payload to add a member to a team */
export interface AddTeamMemberPayload {
  userId: string;
}

/** Teams list response */
export interface TeamsListResponse {
  items: Team[];
  pagination: PaginationMeta;
}

/** Team members list response */
export interface TeamMembersListResponse {
  items: TeamMember[];
  pagination: PaginationMeta;
}

/** Query params for teams list */
export interface TeamsQueryParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  leaderId?: string;
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

export type TransferRequestStatus = "requested" | "approved" | "rejected" | "fulfilled";
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
  activeLoans: number;
  pendingInspections: number;
  overdueInvoices: number;
  damagedItems: number;
  maintenanceItems: number;
  pendingTransfers: number;
  loansExpiringSoon: number;
}

/** Individual inspection item in the queue. */
export interface OpsInspectionItem {
  loanId: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  returnDate: string;
  status: "pending" | "in-progress";
}

/** Grouped inspection queue from GET /locations/:id/operations/inspections */
export interface OpsInspectionsResponse {
  pending: OpsInspectionItem[];
  inProgress: OpsInspectionItem[];
  total: number;
}

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
