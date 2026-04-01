import { CheckCircle, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { createElement } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type HistorySortField = "date" | "event" | "amount";
export type HistorySortDirection = "asc" | "desc";

// ─── Constants ───────────────────────────────────────────────────────────────

export const HISTORY_PREFS_KEY = "subscriptionManagement.historyPrefs";
export const HISTORY_PAGE_SIZE = 10;

export const EVENT_TYPE_BADGE: Record<string, string> = {
  payment_succeeded: "bg-green-900/50 text-green-400 border border-green-700",
  subscription_created: "bg-blue-900/50 text-blue-400 border border-blue-700",
  subscription_updated: "bg-yellow-900/50 text-yellow-400 border border-yellow-700",
  subscription_cancelled: "bg-red-900/50 text-red-400 border border-red-700",
};

export const EVENT_TYPE_ICON: Record<string, React.ReactNode> = {
  payment_succeeded: createElement(CheckCircle, { size: 14 }),
  subscription_created: createElement(CreditCard, { size: 14 }),
  subscription_updated: createElement(RefreshCw, { size: 14 }),
  subscription_cancelled: createElement(XCircle, { size: 14 }),
};
