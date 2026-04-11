import React from "react";
import { History, Eye, CheckCircle, AlertTriangle, XCircle, FileText } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type { InspectionListItem, InspectionItemResponse } from "../../../../../types/api";

interface CompletedInspectionsTableProps {
  inspections: InspectionListItem[];
  onView: (inspection: InspectionListItem) => void;
}

/**
 * Historical list of completed inspections.
 */
export const CompletedInspectionsTable: React.FC<CompletedInspectionsTableProps> = ({
  inspections,
  onView,
}) => {
  const { t, formatDate } = useLanguage();

  if (inspections.length === 0) {
    return (
      <div className="text-center py-24 bg-[#1a1a1a] rounded-xl border border-dashed border-[#333]">
        <History className="w-16 h-16 text-gray-700 mx-auto mb-6" />
        <h3 className="text-xl font-medium text-white mb-2">{t("inspections.historyEmpty")}</h3>
        <p className="text-gray-400">{t("inspections.noCompleted")}</p>
      </div>
    );
  }

  const getOverallCondition = (items: InspectionItemResponse[]) => {
    if (items.some((i) => i.conditionAfter === "lost"))
      return { icon: XCircle, color: "text-red-500", text: t("inspections.lossReport") };
    if (items.some((i) => i.conditionAfter === "damaged"))
      return { icon: AlertTriangle, color: "text-yellow-500", text: t("inspections.damagesFound") };
    return { icon: CheckCircle, color: "text-green-500", text: t("inspections.allGood") };
  };

  const sortedInspections = [...inspections].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descendente: más reciente primero
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#0f0f0f] border-b border-[#333]">
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider font-mono">
              {t("inspections.inspectionId")}
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider font-mono">
              {t("inspections.loanRef")}
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              {t("common.date") || "Fecha"}
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              {t("inspections.statusSummary")}
            </th>
            <th className="text-left py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              {t("inspections.notesPreview")}
            </th>
            <th className="text-right py-4 px-6 text-gray-400 font-semibold text-xs uppercase tracking-wider">
              {t("inspections.viewDetail")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222]">
          {sortedInspections.map((inspection) => {
            const status = getOverallCondition(inspection.items);
            const StatusIcon = status.icon;

            return (
              <tr
                key={inspection._id}
                className="hover:bg-[#1a1a1a] transition-all duration-150 group"
              >
                <td className="py-5 px-6">
                  <div className="flex flex-col">
                    <span className="text-white font-mono text-xs group-hover:text-[#FFD700] transition-colors">
                      {inspection.inspectionNumber ?? `#${inspection._id.slice(-8).toUpperCase()}`}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="text-gray-400 font-mono text-xs group-hover:text-gray-300">
                    {typeof inspection.loanId === "string"
                      ? inspection.loanId
                      : (inspection.loanId.code ??
                        `#${inspection.loanId._id.slice(-8).toUpperCase()}`)}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-gray-400 text-xs">
                    {formatDate(inspection.createdAt)}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center">
                    <StatusIcon className={`w-3.5 h-3.5 mr-2 ${status.color}`} />
                    <span className={`text-xs font-bold leading-none capitalize ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className="flex items-center text-gray-500 text-xs italic line-clamp-1 max-w-[200px]">
                    <FileText className="w-3 h-3 mr-1.5 flex-shrink-0" />
                    {inspection.notes || t("inspections.noNotes")}
                  </div>
                </td>
                <td className="py-5 px-6 text-right">
                  <button
                    onClick={() => onView(inspection)}
                    className="p-2 text-gray-400 hover:text-[#FFD700] hover:bg-[#333] rounded-lg transition-all"
                    title={t("inspections.viewDetails")}
                    aria-label={t("inspections.viewDetails")}
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
