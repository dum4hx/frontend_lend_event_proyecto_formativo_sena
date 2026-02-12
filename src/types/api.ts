/**
 * TypeScript interfaces for every API entity and payload.
 *
 * These mirror the shapes described in `API_DOCUMENTATION.md` and are
 * imported by service modules and components to ensure compile-time
 * safety across the entire frontend.
 */

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

/** Postal address shared between organizations and customers. */
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// ─── User ──────────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "owner"
  | "manager"
  | "warehouse_operator"
  | "commercial_advisor";

export type UserStatus = "active" | "inactive" | "invited" | "suspended";

export interface User {
  id: string;
  email: string;
  name: PersonName;
  role: UserRole;
  status: UserStatus;
  phone?: string;
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
  features: string[];
  sortOrder: number;
  stripePriceIdBase?: string;
  stripePriceIdSeat?: string;
  status: SubscriptionStatus;
}

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

export type DocumentType =
  | "national_id"
  | "passport"
  | "drivers_license"
  | "tax_id";

export type CustomerStatus = "active" | "inactive" | "blacklisted";

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

export interface MaterialCategory {
  _id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface CreateMaterialCategoryPayload {
  name: string;
  description?: string;
  parentId?: string;
}

export interface MaterialType {
  _id: string;
  name: string;
  description?: string;
  categoryId: string;
  pricePerDay: number;
  replacementCost?: number;
}

export interface CreateMaterialTypePayload {
  name: string;
  description?: string;
  categoryId: string;
  pricePerDay: number;
  replacementCost?: number;
}

export type MaterialInstanceStatus =
  | "available"
  | "reserved"
  | "loaned"
  | "returned"
  | "maintenance"
  | "damaged"
  | "lost"
  | "retired";

export interface MaterialInstance {
  _id: string;
  modelId: string;
  serialNumber: string;
  status: MaterialInstanceStatus;
  purchaseDate?: string;
  purchaseCost?: number;
}

export interface CreateMaterialInstancePayload {
  modelId: string;
  serialNumber: string;
  purchaseDate?: string;
  purchaseCost?: number;
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
  materialTypes: PackageMaterialEntry[];
  pricePerDay?: number;
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  materialTypes: PackageMaterialEntry[];
  pricePerDay?: number;
}

// ─── Loan Requests ─────────────────────────────────────────────────────────

export type LoanRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "ready"
  | "cancelled";

export interface LoanRequestItem {
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
}

export interface CreateLoanRequestPayload {
  customerId: string;
  items: LoanRequestItem[];
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface AssignMaterialPayload {
  materialTypeId: string;
  materialInstanceId: string;
}

// ─── Loans ─────────────────────────────────────────────────────────────────

export type LoanStatus = "active" | "overdue" | "returned" | "closed";

export interface Loan {
  _id: string;
  customerId: string;
  requestId: string;
  status: LoanStatus;
  startDate: string;
  endDate: string;
  notes?: string;
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
  notes?: string;
  damageDescription?: string;
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
}

// ─── Invoices ──────────────────────────────────────────────────────────────

export type InvoiceStatus = "pending" | "paid" | "cancelled";
export type InvoiceType = "rental" | "damage" | "deposit";

export interface Invoice {
  _id: string;
  status: InvoiceStatus;
  type: InvoiceType;
  amount: number;
  customerId: string;
  loanId?: string;
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

// ─── Auth Responses ────────────────────────────────────────────────────────

export interface RegisterResponseData {
  organization: { id: string; name: string; email: string };
  user: { id: string; email: string; name: PersonName; role: UserRole };
}

export interface LoginResponseData {
  user: User;
}

export interface MeResponseData {
  user: User;
}

// ─── User Management Payloads ──────────────────────────────────────────────

export interface InviteUserPayload {
  name: PersonName;
  email: string;
  phone: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  name?: Partial<PersonName>;
  email?: string;
  phone?: string;
}

export interface UpdateUserRolePayload {
  role: UserRole;
}

// ─── Query Params ──────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UsersQueryParams extends PaginationParams {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface CustomersQueryParams extends PaginationParams {
  status?: CustomerStatus;
  search?: string;
}

export interface MaterialTypesQueryParams {
  categoryId?: string;
  search?: string;
}

export interface MaterialInstancesQueryParams {
  status?: MaterialInstanceStatus;
  materialTypeId?: string;
  search?: string;
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
