import React from "react";
import { X, CheckCircle, AlertTriangle, XCircle, FileText } from "lucide-react";
import type { Inspection } from "../../../../../types/api";

interface InspectionDetailModalProps {
  inspection: Inspection;
  onClose: () => void;
}

/**
 * Read-only modal for viewing details of a completed inspection.
 */
export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  onClose,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusIcons = {
    good: { icon: CheckCircle, color: "text-green-500", label: "Good" },
    damaged: { icon: AlertTriangle, color: "text-yellow-500", label: "Damaged" },
    lost: { icon: XCircle, color: "text-red-500", label: "Lost" },
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Inspection Details</h2>
            <p className="text-sm text-gray-400 font-mono mt-1">{inspection._id}</p>
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
          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              Loan Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#1a1a1a] p-5 rounded-lg border border-[#222]">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase">Loan ID</label>
                <p className="text-white font-mono break-all font-medium">
                  {typeof inspection.loanId === "string"
                    ? inspection.loanId
                    : (inspection.loanId as unknown as { _id: string })._id}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#FFD700] uppercase tracking-widest mb-4">
              Inspected Items ({inspection.items.length})
            </h3>
            <div className="space-y-4">
              {inspection.items.map((item, idx) => {
                const status = statusIcons[item.condition];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={idx}
                    className="p-5 border border-[#2a2a2a] bg-[#1a1a1a] rounded-lg hover:border-[#333] transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center">
                        <StatusIcon className={`w-5 h-5 mr-3 ${status.color}`} />
                        <div>
                          <p className="text-white font-medium capitalize">{status.label}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            ID:{" "}
                            {typeof item.materialInstanceId === "string"
                              ? item.materialInstanceId
                              : (item.materialInstanceId as unknown as { _id: string })._id}
                          </p>
                        </div>
                      </div>
                      {item.damageCost !== undefined && item.damageCost > 0 && (
                        <div className="bg-red-900/40 px-3 py-1.5 rounded-full border border-red-500/30">
                          <p className="text-red-200 text-xs font-bold">
                            Total Damage Cost:{" "}
                            <span className="text-red-100 font-black">
                              {formatCurrency(item.damageCost)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {(item.damageDescription || item.notes) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                        {item.damageDescription && (
                          <div className="bg-red-900/[0.15] border border-red-900/30 p-4 rounded-md">
                            <label className="block text-[10px] text-red-300 mb-1 font-bold uppercase tracking-wider">
                              Damage Description
                            </label>
                            <p className="text-gray-200 text-sm italic">
                              "{item.damageDescription}"
                            </p>
                          </div>
                        )}
                        {item.notes && (
                          <div className="bg-gray-800/20 border border-gray-700/50 p-4 rounded-md">
                            <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">
                              Specific Item Notes
                            </label>
                            <p className="text-gray-300 text-sm">"{item.notes}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#333] pt-6 flex flex-col md:flex-row items-start md:items-center justify-between pb-6">
            <div className="flex itms-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">
                  Overall Notes
                </span>
                <p className="text-white mt-1 italic text-lg leading-relaxed whitespace-pre-line">
                  {inspection.overallNotes || "No notes registered."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
