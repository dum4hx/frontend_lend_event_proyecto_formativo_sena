import { CheckCircle2, Package as PackageIcon, Zap } from "lucide-react";
import type { AvailableMaterialInstance } from "../../../../types/api";
import type { MaterialTypeRow } from "./types";
import { useLanguage } from "../../../../contexts/useLanguage";

interface MaterialAssignmentCardProps {
  row: MaterialTypeRow;
  selected: string[];
  onToggleInstance: (materialTypeId: string, instanceId: string, requiredQty: number) => void;
  onAutoAssign: (row: MaterialTypeRow) => void;
}

export default function MaterialAssignmentCard({
  row,
  selected,
  onToggleInstance,
  onAutoAssign,
}: MaterialAssignmentCardProps) {
  const isFulfilled = selected.length >= row.quantity;
  const { t } = useLanguage();

  const renderInstanceBadge = (inst: AvailableMaterialInstance) => {
    const isSelected = selected.includes(inst._id);
    const isCapReached = !isSelected && selected.length >= row.quantity;
    const isAvailNow = inst.availability === "available";

    return (
      <button
        key={inst._id}
        onClick={() => onToggleInstance(row.materialTypeId, inst._id, row.quantity)}
        disabled={isCapReached}
        aria-pressed={isSelected}
        title={`${inst.serialNumber} — ${inst.availability}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          isSelected
            ? isAvailNow
              ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
              : "bg-blue-500/20 border-blue-500/60 text-blue-300"
            : isCapReached
              ? "opacity-40 cursor-not-allowed bg-[#1a1a1a] border-[#333] text-gray-500"
              : isAvailNow
                ? "bg-[#1a1a1a] border-[#444] text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                : "bg-[#1a1a1a] border-[#444] text-gray-400 hover:border-blue-500/50 hover:bg-blue-500/5"
        }`}
      >
        <span>{inst.serialNumber}</span>
        <span
          className={`text-[10px] px-1 py-0.5 rounded ${
            isAvailNow ? "bg-[#FFD700]/20 text-[#FFD700]" : "bg-gray-700/80 text-gray-400"
          }`}
        >
          {isAvailNow
            ? t("orders.prepare.availability.available")
            : t("orders.prepare.availability.upcoming")}
        </span>
      </button>
    );
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isFulfilled ? "border-emerald-500/40 bg-emerald-500/5" : "border-[#444] bg-[#121212]"
      }`}
    >
      {/* Row header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isFulfilled ? (
            <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
          ) : (
            <PackageIcon size={15} className="text-gray-500 flex-shrink-0" />
          )}
          <span className="font-semibold text-white text-sm">{row.materialTypeName}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              isFulfilled ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-700 text-gray-400"
            }`}
          >
            {selected.length}/{row.quantity}
          </span>
        </div>
        <button
          className="text-xs text-[#FFD700] hover:underline flex items-center gap-1 flex-shrink-0"
          onClick={() => onAutoAssign(row)}
        >
          <Zap size={10} />
          {t("orders.prepare.autoAssign")}
        </button>
      </div>

      {/* Instance badges */}
      {row.currentUserInstances.length === 0 ? (
        <p className="text-xs text-gray-500 italic">{t("orders.prepare.noInstances")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {row.currentUserInstances.map(renderInstanceBadge)}
        </div>
      )}
    </div>
  );
}
