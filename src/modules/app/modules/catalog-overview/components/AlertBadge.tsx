import React from "react";
import {
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  Lock,
} from "lucide-react";
import type { CatalogMaterialTypeAlert } from "../../../../../types/api";

/** Alert configuration with icons and colors */
const ALERT_CONFIG: Record<
  CatalogMaterialTypeAlert["type"],
  { label: string; icon: React.FC<{ size: number; className: string }> }
> = {
  LOW_STOCK: {
    label: "Stock Bajo",
    icon: (props) => <AlertTriangle {...props} />,
  },
  HIGH_UTILIZATION: {
    label: "Alto Uso",
    icon: (props) => <TrendingUp {...props} />,
  },
  HIGH_DAMAGE_RATE: {
    label: "Daño Alto",
    icon: (props) => <AlertCircle {...props} />,
  },
  OVER_RESERVED: {
    label: "Reservado",
    icon: (props) => <Lock {...props} />,
  },
};

interface AlertBadgeProps {
  /** The alert object from the catalog overview response. */
  alert: CatalogMaterialTypeAlert;
}

/**
 * AlertBadge — Enhanced badge displaying a catalog alert type with icon.
 *
 * - `high` severity → red theme with strong visual emphasis
 * - `medium` severity → amber/yellow theme
 */
export const AlertBadge: React.FC<AlertBadgeProps> = ({ alert }) => {
  const isHigh = alert.severity === "high";
  const config = ALERT_CONFIG[alert.type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
        isHigh
          ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
          : "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
      }`}
    >
      <Icon
        size={14}
        className={`flex-shrink-0 ${
          isHigh ? "text-red-500" : "text-amber-500"
        }`}
      />
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
