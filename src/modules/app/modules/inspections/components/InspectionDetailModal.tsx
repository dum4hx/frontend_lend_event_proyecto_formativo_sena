import React, { useState } from "react";
import { X, CheckCircle, AlertTriangle, XCircle, FileText, User, Clock, Eye, Copy } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../../hooks/useCopyToClipboard";
import { EntityLink } from "../../../../../components/ui";
import type { InspectionListItem, MaterialInstance } from "../../../../../types/api";
import { getMaterialInstance } from "../../../../../services/materialService";
import { MaterialInstanceDetailModal } from "../../material-instances/components/MaterialInstanceDetailModal";

interface InspectionDetailModalProps {
  inspection: InspectionListItem;
  onClose: () => void;
}

/**
 * Read-only modal for viewing details of a completed inspection.
 */
export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  onClose,
}) => {
  const { t, formatCurrency: formatCurrencyLocale } = useLanguage();
  const { copy } = useCopyToClipboard();
  const [selectedInstance, setSelectedInstance] = useState<MaterialInstance | null>(null);
  const [loadingInstance, setLoadingInstance] = useState(false);

  const formatCurrency = (amount: number) => {
    return formatCurrencyLocale(amount);
  };

  const statusIcons = {
    good: { icon: CheckCircle, color: "text-green-500", label: t("inspections.allGood") },
    damaged: {
      icon: AlertTriangle,
      color: "text-yellow-500",
      label: t("inspections.damagesFound"),
    },
    lost: { icon: XCircle, color: "text-red-500", label: t("inspections.lossReport") },
  };

  // Map condition values to translated labels
  const getConditionLabel = (condition?: string): string => {
    if (!condition) return t("inspections.notAvailable");
    switch (condition.toLowerCase()) {
      case "good":
        return t("inspections.conditionGood");
      case "damaged":
        return t("inspections.conditionDamaged");
      case "lost":
        return t("inspections.conditionLost");
      default:
        return condition;
    }
  };

  const handleViewDetails = async (instanceId: string) => {
    setLoadingInstance(true);
    try {
      const res = await getMaterialInstance(instanceId);
      setSelectedInstance(res.data.instance);
    } catch (err) {
      console.error("Failed to load material instance details:", err);
    } finally {
      setLoadingInstance(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedInstance(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">{t("inspections.detailsTitle")}</h2>
            <p className="text-sm text-gray-400 font-mono mt-1">
              {inspection.inspectionNumber ?? inspection._id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Inspector Info Section */}
          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              {t("inspections.inspectionInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#1a1a1a] p-5 rounded-lg border border-[#222]">
              <div className="flex items-start">
                <User className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                <div className="w-full">
                  <label className="block text-xs text-gray-400 mb-2 uppercase font-semibold">
                    {t("inspections.performedBy")}
                  </label>
                  <div className="space-y-1">
                    <p className="text-white font-medium">
                    {inspection.inspectedBy?.profile?.firstName || t("inspections.notAvailable")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {inspection.inspectedBy?.email || t("inspections.notAvailable")}
                    </p>
                    <p className="text-xs text-amber-400 font-medium">
                    {inspection.inspectedBy?.role?.name || t("inspections.notAvailable")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-500 mr-3" />
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase">
                    {t("inspections.inspectionDate")}
                  </label>
                  <p className="text-white font-medium">
                    {new Date(inspection.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(inspection.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              {t("inspections.loanMetadata")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#1a1a1a] p-5 rounded-lg border border-[#222]">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase">
                  {t("inspections.loanIdDetail")}
                </label>
                <button
                  onClick={() => copy(inspection.loanId.code ?? inspection.loanId._id)}
                  className="font-mono break-all font-medium text-blue-400 hover:text-[#FFD700] hover:underline transition-colors flex items-center gap-1 group/copy inline"
                  title="Haz click para copiar"
                >
                  {inspection.loanId.code ?? inspection.loanId._id}
                  <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>

          {/* Materials Inspected Section */}
          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              {t("inspections.materialsReviewed")} ({inspection.items?.length || 0})
            </h3>
            {inspection.items && inspection.items.length > 0 ? (
              <div className="space-y-4">
                {inspection.items.map((item, idx) => {
                  const status = statusIcons[item.conditionAfter] || statusIcons.good;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={idx}
                      className="p-5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-lg hover:border-[#333] transition-all"
                    >
                      {/* Material Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-[#222]">
                        <div className="flex items-start flex-1">
                          <StatusIcon className={`w-5 h-5 mr-3 mt-1 flex-shrink-0 ${status.color}`} />
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg">
                              {item.materialType?.name || t("inspections.notAvailable")}
                            </p>
                            <p className="text-xs text-gray-400 font-mono mt-2">
                              {t("inspections.serialNumber")}: 
                              <button
                                onClick={() => copy(
                                  typeof item.materialInstanceId === "string"
                                    ? item.materialInstanceId
                                    : item.materialInstanceId.serialNumber
                                )}
                                className="ml-1 text-gray-300 font-medium hover:text-[#FFD700] hover:underline transition-colors inline-flex items-center gap-1 group/copy"
                                title="Haz click para copiar"
                              >
                                {typeof item.materialInstanceId === "string"
                                  ? item.materialInstanceId
                                  : item.materialInstanceId.serialNumber}
                                <Copy size={11} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                              </button>
                            </p>
                            <p className="text-xs text-gray-500 italic">{status.label}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end">
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            {item.chargeToCustomer !== undefined && item.chargeToCustomer > 0 && (
                              <div className="bg-red-900/40 px-3 py-1.5 rounded-full border border-red-500/30">
                                <p className="text-red-200 text-xs font-bold">
                                  {t("inspections.totalDamageCost")}: <span className="text-red-100 font-black">{formatCurrency(item.chargeToCustomer)}</span>
                                </p>
                              </div>
                            )}
                            {item.repairRequired && (
                              <span className="bg-orange-900/40 px-3 py-1.5 rounded-full border border-orange-500/30 text-orange-200 text-xs font-bold">
                                {t("inspections.repairRequired")}
                              </span>
                            )}
                          </div>
                          {typeof item.materialInstanceId !== "string" && (
                            <button
                              onClick={() => handleViewDetails(item.materialInstanceId._id)}
                              disabled={loadingInstance}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/30 text-[#FFD700] rounded-md transition-all text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t("inspections.viewMaterialInstance")}
                            >
                              <Eye size={14} />
                              {loadingInstance ? t("common.loading") : t("inspections.viewDetail")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Condition Details */}
                      {(item.conditionBefore || item.conditionAfter) && (
                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#222]">
                          {item.conditionBefore && (
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">
                                {t("reports.col.conditionBefore")}
                              </label>
                              <p className="text-gray-300 text-sm">{getConditionLabel(item.conditionBefore)}</p>
                            </div>
                          )}
                          {item.conditionAfter && (
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">
                                {t("reports.col.conditionAfter")}
                              </label>
                              <p className="text-gray-300 text-sm font-medium">{getConditionLabel(item.conditionAfter)}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Report Details */}
                      {(item.damageDescription || item.notes) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {item.damageDescription && (
                            <div className="bg-red-900/[0.15] border border-red-900/30 p-4 rounded-md">
                              <label className="block text-[10px] text-red-300 mb-2 font-bold uppercase tracking-wider">
                                {t("inspections.damageDescriptionDetail")}
                              </label>
                              <p className="text-gray-200 text-sm leading-relaxed">
                                {item.damageDescription}
                              </p>
                            </div>
                          )}
                          {item.notes && (
                            <div className="bg-gray-800/20 border border-gray-700/50 p-4 rounded-md">
                              <label className="block text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-wider">
                                {t("inspections.itemNotesDetail")}
                              </label>
                              <p className="text-gray-300 text-sm leading-relaxed">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 bg-[#1a1a1a] rounded-lg border border-[#222]">
                <p className="text-gray-400 text-sm italic">{t("inspections.noNotes")}</p>
              </div>
            )}
          </div>

          <div className="border-t border-[#333] pt-6 flex flex-col md:flex-row items-start md:items-center justify-between pb-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                  {t("inspections.overallNotesDetail")}
                </span>
                <p className="text-white mt-1 italic text-lg leading-relaxed whitespace-pre-line">
                  {inspection.notes || t("inspections.noNotes")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Instance Detail Modal */}
      {selectedInstance && (
        <MaterialInstanceDetailModal instance={selectedInstance} onClose={handleCloseDetails} />
      )}
    </div>
  );
};
