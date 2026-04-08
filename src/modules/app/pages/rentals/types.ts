import type { Loan, LoanStatus, Customer } from "../../../../types/api";

export type { Loan, LoanStatus, Customer, ExtendLoanPayload } from "../../../../types/api";

/** Combined view of a loan with its resolved customer. */
export interface LoanView {
  loan: Loan;
  customer?: Customer;
}

/** Status filter option including "all". */
export type LoanFilter = "all" | LoanStatus;

/** Ordered list of filter options. */
export const STATUS_OPTIONS: LoanFilter[] = ["all", "active", "overdue", "returned", "inspected", "closed"];
