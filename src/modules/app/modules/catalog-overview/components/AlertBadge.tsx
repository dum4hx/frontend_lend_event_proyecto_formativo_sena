import React from "react";
import type { CatalogMaterialTypeAlert } from "../../../../../types/api";

/** Human-readable labels for each alert type. */
const ALERT_LABELS: Record<CatalogMaterialTypeAlert["type"], string> = {
  LOW_STOCK: "Low Stock",
  HIGH_UTILIZATION: "High Use",
  HIGH_DAMAGE_RATE: "Damage",
  OVER_RESERVED: "Over-Reserved",
};

interface AlertBadgeProps {
  /** The alert object from the catalog overview response. */
  alert: CatalogMaterialTypeAlert;
}

/**
 * AlertBadge — Small colored pill displaying a catalog alert type and severity.
 *
 * - `high` severity → red background
 * - `medium` severity → amber/yellow background
 */
export const AlertBadge: React.FC<AlertBadgeProps> = ({ alert }) => {
  const isHigh = alert.severity === "high";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isHigh ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
      }`}
    >
      {ALERT_LABELS[alert.type]}
    </span>
  );
};
