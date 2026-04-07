import type { LoanStatus, LoanFilter, Customer } from "./types";

/** Localized status label. */
export function getStatusLabel(status: LoanFilter, language: "en" | "es"): string {
  switch (status) {
    case "all":
      return language === "es" ? "Todos los estados" : "All Status";
    case "active":
      return language === "es" ? "Activo" : "Active";
    case "overdue":
      return language === "es" ? "Vencido" : "Overdue";
    case "returned":
      return language === "es" ? "Devuelto" : "Returned";
    case "closed":
      return language === "es" ? "Cerrado" : "Closed";
    default:
      return status;
  }
}

/** Tailwind badge classes for loan status. */
export function getLoanStatusBadgeStyle(status: LoanStatus): string {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border border-green-500/30";
    case "overdue":
      return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "returned":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    case "closed":
      return "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

/** Format a date string using the given locale. */
export function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Calculate remaining days until end date (negative = overdue). */
export function daysRemaining(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Full display name from a customer record. */
export function customerFullName(customer?: Customer): string {
  if (!customer) return "—";
  const { firstName, firstSurname, secondSurname } = customer.name;
  return [firstName, firstSurname, secondSurname].filter(Boolean).join(" ");
}
