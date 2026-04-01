import React from "react";
import {
  Layers,
  Package,
  TrendingUp,
  Activity,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { StatCard } from "../../../../../components/ui";
import type { CatalogOverviewSummary } from "../../../../../types/api";

interface CatalogSummaryCardsProps {
  /** The summary object from the catalog overview response. */
  summary: CatalogOverviewSummary;
}

/** Format a 0–1 rate as a percentage string with one decimal. */
function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * CatalogSummaryCards — Responsive grid of six stat cards showing
 * org-wide catalog metrics (types, instances, rates, alerts).
 */
export const CatalogSummaryCards: React.FC<CatalogSummaryCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={<Layers className="w-5 h-5" />}
        label="Material Types"
        value={summary.totalMaterialTypes}
      />
      <StatCard
        icon={<Package className="w-5 h-5" />}
        label="Total Instances"
        value={summary.totalInstances}
      />
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        label="Availability"
        value={pct(summary.globalAvailabilityRate)}
      />
      <StatCard
        icon={<Activity className="w-5 h-5" />}
        label="Utilization"
        value={pct(summary.globalUtilizationRate)}
      />
      <StatCard
        icon={<AlertTriangle className="w-5 h-5" />}
        label="Low Stock"
        value={summary.materialTypesWithLowStock}
      />
      <StatCard
        icon={<ShieldAlert className="w-5 h-5" />}
        label="High Damage"
        value={summary.materialTypesWithHighDamage}
      />
    </div>
  );
};
