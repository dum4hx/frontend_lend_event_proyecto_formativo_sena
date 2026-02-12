/**
 * Admin service barrel re-export.
 *
 * The original monolithic adminService has been split into domain-
 * specific modules.  This file re-exports everything so that
 * existing imports keep working without changes.
 */

export { getOrganization, updateOrganization, getOrganizationUsage } from "./organizationService";
export { getCustomers, getCustomer, createCustomer, updateCustomer, blacklistCustomer, deleteCustomer } from "./customerService";
export { getUsers, getUser, inviteUser, updateUser, updateUserRole, deactivateUser, reactivateUser, deleteUser } from "./userService";
export { getPackages, getPackage, createPackage } from "./materialService";
export { getRequests, createRequest, approveRequest, rejectRequest, updateRequest } from "./loanService";
export { getLoans, getLoan, getOverdueLoans, createLoanFromRequest, extendLoan, returnLoan } from "./loanService";
export { getInvoices, getInvoicesSummary, recordPayment, voidInvoice } from "./invoiceService";
export { getCurrentUser } from "./authService";
