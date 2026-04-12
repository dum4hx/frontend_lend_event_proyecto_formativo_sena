import React from "react";
import type { CatalogMaterialTypeAlert } from "../../../../../types/api";
import { useLanguage } from "../../../../../contexts/useLanguage";

/** Bilingual labels for each alert type. */
const ALERT_LABELS: Record<CatalogMaterialTypeAlert["type"], { en: string; es: string }> = {
  LOW_STOCK: { en: "Low Stock", es: "Stock bajo" },
  HIGH_UTILIZATION: { en: "High Use", es: "Uso alto" },
  HIGH_DAMAGE_RATE: { en: "Damage", es: "Daño" },
  OVER_RESERVED: { en: "Over-Reserved", es: "Sobre-reservado" },
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
  const { language } = useLanguage();
  const isHigh = alert.severity === "high";
  const lang = language === "es" ? "es" : "en";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        isHigh ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
      }`}
    >
      {ALERT_LABELS[alert.type][lang]}
    </span>
  );
};
