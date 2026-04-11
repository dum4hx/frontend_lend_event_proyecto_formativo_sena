import { AlertTriangle, ArrowLeftRight, ArrowRight } from "lucide-react";
import Button from "../../../../components/ui/Button";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { WarehouseLocation } from "../../../../services/warehouseOperatorService";
import type { MaterialTypeRow, ShortfallGroup } from "./types";

interface ShortfallSectionProps {
  shortfallByType: Map<string, number>;
  shortfallGroups: ShortfallGroup[];
  materialTypeRows: MaterialTypeRow[];
  userLocations: WarehouseLocation[];
  destinationLocationId: string;
  onDestinationChange: (value: string) => void;
  transferNotes: string;
  onTransferNotesChange: (value: string) => void;
  destinationConflict: boolean;
  canCreateTransfer: boolean;
  submittingTransfer: boolean;
  onCreateTransferRequests: () => void;
}

export default function ShortfallSection({
  shortfallByType,
  shortfallGroups,
  materialTypeRows,
  userLocations,
  destinationLocationId,
  onDestinationChange,
  transferNotes,
  onTransferNotesChange,
  destinationConflict,
  canCreateTransfer,
  submittingTransfer,
  onCreateTransferRequests,
}: ShortfallSectionProps) {
  const { t } = useLanguage();

  if (shortfallByType.size === 0) return null;

  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0" />
        <h3 className="font-semibold text-yellow-300 text-sm">
          {t("orders.prepare.shortfall.title")}
        </h3>
      </div>
      <p className="text-sm text-yellow-200/70">
        {t("orders.prepare.shortfall.description", { count: shortfallByType.size })}
      </p>

      {/* Shortfall summary per type */}
      <div className="space-y-1">
        {Array.from(shortfallByType.entries()).map(([typeId, need]) => {
          const row = materialTypeRows.find((r) => r.materialTypeId === typeId);
          return (
            <div key={typeId} className="flex items-center gap-2 text-sm">
              <span className="text-gray-300">{row?.materialTypeName ?? typeId}</span>
              <ArrowRight size={12} className="text-gray-500 flex-shrink-0" />
              <span className="text-red-400">
                {t("orders.prepare.shortfall.moreNeeded", { count: need })}
              </span>
            </div>
          );
        })}
      </div>

      {shortfallGroups.length > 0 ? (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {t("orders.prepare.shortfall.suggestedSources")}
          </p>
          <div className="space-y-2">
            {shortfallGroups.map((group) => (
              <div
                key={group.fromLocationId}
                className="flex items-start gap-3 bg-[#121212] rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-gray-500 text-xs mt-0.5 flex-shrink-0">
                  {t("orders.prepare.shortfall.from")}
                </span>
                <div>
                  <span className="text-white font-medium">{group.fromLocationName}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {group.items.map((item) => (
                      <span
                        key={item.materialTypeId}
                        className="text-xs bg-[#333] text-gray-300 px-2 py-0.5 rounded"
                      >
                        {item.quantity}× {item.materialTypeName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Destination & notes */}
          <div className="space-y-3 pt-3 border-t border-yellow-500/20">
            <div>
              <label
                htmlFor="transfer-destination"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                {t("orders.prepare.shortfall.destinationLabel")}{" "}
                <span className="text-red-400" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="transfer-destination"
                value={destinationLocationId}
                onChange={(e) => onDestinationChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-[#444] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-colors text-sm"
              >
                <option value="">{t("orders.prepare.shortfall.destinationPlaceholder")}</option>
                {userLocations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {destinationConflict && (
                <p className="text-xs text-red-400 mt-1">
                  {t("orders.prepare.shortfall.destinationConflict")}
                </p>
              )}
              {destinationLocationId === "" && shortfallGroups.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("orders.prepare.shortfall.destinationRequired")}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="transfer-notes"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                {t("orders.prepare.shortfall.notesLabel")}{" "}
                <span className="text-gray-500 font-normal">({t("common.optional")})</span>
              </label>
              <textarea
                id="transfer-notes"
                value={transferNotes}
                onChange={(e) => onTransferNotesChange(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder={t("orders.prepare.shortfall.notesPlaceholder")}
                className="w-full px-3 py-2 bg-[#121212] border border-[#444] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-colors text-sm resize-none"
              />
            </div>

            <Button
              leftIcon={ArrowLeftRight}
              onClick={onCreateTransferRequests}
              disabled={!canCreateTransfer}
              className="bg-yellow-500/15 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/25 disabled:opacity-50"
            >
              {submittingTransfer
                ? t("orders.prepare.shortfall.creating")
                : shortfallGroups.length > 1
                  ? t("orders.prepare.shortfall.createTransfers", { count: shortfallGroups.length })
                  : t("orders.prepare.shortfall.createTransfer", { count: shortfallGroups.length })}
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-yellow-200/60 italic">
          {t("orders.prepare.shortfall.noSources")}
        </p>
      )}
    </div>
  );
}
