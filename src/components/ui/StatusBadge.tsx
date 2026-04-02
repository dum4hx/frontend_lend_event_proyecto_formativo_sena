/**
 * StatusBadge — Generic status indicator with configurable colour maps.
 *
 * Ships with commonly-used presets (loan, invoice, material-instance, user …).
 * Pass a custom `colorMap` to override or add domain-specific statuses.
 */

export interface StatusBadgeProps {
  /** Status string value (lowercased internally). */
  status: string;
  /** Custom colour map keyed by status → Tailwind class string. Falls back to neutral. */
  colorMap?: Record<string, string>;
  /** Extra class names on the root element. */
  className?: string;
}

/** Default colour map covering common statuses across the app. */
const defaultColorMap: Record<string, string> = {
  // Positive
  active: "badge-success",
  available: "badge-success",
  paid: "badge-success",
  completed: "badge-success",
  approved: "badge-success",
  good: "badge-success",
  held: "badge-success",
  refunded: "badge-success",
  // Warning
  pending: "badge-warning",
  deposit_pending: "badge-warning",
  reserved: "badge-warning",
  overdue: "badge-warning",
  maintenance: "badge-warning",
  draft: "badge-warning",
  invited: "badge-warning",
  partially_applied: "badge-warning",
  refund_pending: "badge-warning",
  in_progress: "badge-warning",
  in_repair: "badge-warning",
  acknowledged: "badge-warning",
  // Danger
  inactive: "badge-danger",
  cancelled: "badge-danger",
  rejected: "badge-danger",
  damaged: "badge-danger",
  lost: "badge-danger",
  suspended: "badge-danger",
  blacklisted: "badge-danger",
  expired: "badge-danger",
  retired: "badge-danger",
  unrecoverable: "badge-danger",
  open: "badge-danger",
  // Info
  assigned: "badge-info",
  ready: "badge-info",
  shipped: "badge-info",
  returned: "badge-info",
  loaned: "badge-info",
  in_use: "badge-info",
  repaired: "badge-info",
  // Gold
  applied: "badge-gold",
  closed: "badge-neutral",
  deprecated: "badge-neutral",
  dismissed: "badge-neutral",
};

/** Human-readable label for a status key. */
function formatLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, colorMap, className = "" }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const merged = colorMap ? { ...defaultColorMap, ...colorMap } : defaultColorMap;
  const badgeClass = merged[key] ?? "badge-neutral";

  return <span className={`badge ${badgeClass} ${className}`}>{formatLabel(key)}</span>;
}
