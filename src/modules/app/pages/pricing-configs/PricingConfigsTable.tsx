import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "../../../../components/ui";
import { SCOPE_LABELS, STRATEGY_LABELS, getScopeBadgeStyle, formatStrategyParams } from "./helpers";
import type { PricingConfig } from "./types";

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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (configs.length === 0) {
    return <div className="text-center py-12 text-gray-400">No pricing configurations found</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#333]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#1a1a1a] text-gray-400 border-b border-[#333]">
            <th className="text-left px-4 py-3 font-semibold">Scope</th>
            <th className="text-left px-4 py-3 font-semibold">Reference ID</th>
            <th className="text-left px-4 py-3 font-semibold">Strategy</th>
            <th className="text-left px-4 py-3 font-semibold">Parameters</th>
            <th className="text-left px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config) => (
            <tr
              key={config._id}
              className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
            >
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getScopeBadgeStyle(config.scope)}`}
                >
                  {SCOPE_LABELS[config.scope]}
                </span>
              </td>
              <td className="px-4 py-3">
                {config.scope === "organization" ? (
                  <span className="font-mono text-xs text-gray-300">—</span>
                ) : config.scope === "materialType" ? (
                  <Link to="/app/material-types" className="entity-link font-mono text-xs">
                    {config.referenceId.slice(-8).toUpperCase()}
                  </Link>
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
