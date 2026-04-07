import { Pencil, Trash2, Loader2, Building2, Layers, Package, Lock } from "lucide-react";
import { IconButton, EntityLink } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { SCOPE_LABELS, STRATEGY_LABELS, getScopeBadgeStyle, formatStrategyParams } from "./helpers";
import type { PricingConfig } from "./types";
import type { PricingScope } from "./types";

const SCOPE_ICONS: Record<PricingScope, typeof Building2> = {
  organization: Building2,
  materialType: Layers,
  package: Package,
};

/** Props for PricingConfigsTable */
interface PricingConfigsTableProps {
  configs: PricingConfig[];
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (config: PricingConfig) => void;
  onDelete: (config: PricingConfig) => void;
}

export function PricingConfigsTable({
  configs,
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: PricingConfigsTableProps) {
  const { t, language } = useLanguage();
  const isEs = language === "es";
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (configs.length === 0) {
    return <div className="text-center py-12 text-gray-400">{t("pricing.empty")}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#333]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
            <th className="text-left px-4 py-3 font-semibold">{t("pricing.tableHeader.scope")}</th>
            <th className="text-left px-4 py-3 font-semibold">
              {t("pricing.tableHeader.referenceId")}
            </th>
            <th className="text-left px-4 py-3 font-semibold">
              {t("pricing.tableHeader.strategy")}
            </th>
            <th className="text-left px-4 py-3 font-semibold">
              {t("pricing.tableHeader.parameters")}
            </th>
            <th className="text-left px-4 py-3 font-semibold">
              {t("pricing.tableHeader.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr
              key={config._id}
              className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const ScopeIcon = SCOPE_ICONS[config.scope];
                    return <ScopeIcon size={14} className="text-[#FFD700]" />;
                  })()}
                  <span className="text-white font-medium text-sm">
                    {SCOPE_LABELS[config.scope].replace(/\s*\(default\)/i, "")}
                  </span>
                  {config.scope === "organization" && (
                    <span className="ml-1 px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] text-xs rounded-full font-semibold flex items-center gap-1">
                      <Lock size={10} />
                      {isEs ? "Predeterminado" : "Default"}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {config.scope === "organization" ? (
                  <span className="font-mono text-xs text-gray-300">—</span>
                ) : config.scope === "materialType" ? (
                  <EntityLink
                    entityType="materialType"
                    entityId={config.referenceId}
                    label={config.referenceId.slice(-8).toUpperCase()}
                    className="font-mono text-xs"
                  />
                ) : (
                  <span className="font-mono text-xs text-gray-300">
                    {config.referenceId.slice(-8).toUpperCase()}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-200">{STRATEGY_LABELS[config.strategyType]}</td>
              <td className="px-4 py-3 text-gray-300 text-xs max-w-xs truncate">
                {formatStrategyParams(config)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <IconButton
                      icon={Pencil}
                      intent="edit"
                      ariaLabel="Edit"
                      onClick={() => onEdit(config)}
                    />
                  )}
                  {canDelete && (
                    <IconButton
                      icon={Trash2}
                      intent="delete"
                      ariaLabel="Delete"
                      onClick={() => onDelete(config)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
