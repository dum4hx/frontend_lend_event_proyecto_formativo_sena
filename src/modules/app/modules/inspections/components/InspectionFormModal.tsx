import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, Eye } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useAuth } from "../../../../../contexts/useAuth";
import { validateDamageDescription } from "../../../../../utils";
import type {
  PendingLoan,
  InspectionItemInput,
  InspectionCondition,
  MaterialInstance,
  MaterialType,
} from "../../../../../types/api";
import { ConditionPicker } from "./ConditionPicker";
import Button from "../../../../../components/ui/Button";
import { MaterialInstanceDetailModal } from "../../../modules/material-instances/components/MaterialInstanceDetailModal";
import { getMaterialInstance, getMaterialTypes } from "../../../../../services/materialService";

interface InspectionFormModalProps {
  loan: PendingLoan;
  onClose: () => void;
  onSave: (payload: {
    loanId: string;
    items: InspectionItemInput[];
    overallNotes?: string;
    dueDate?: string;
  }) => Promise<unknown>;
}

/**
 * Modal form for performing a material inspection on a returned loan.
 * Allows operators to set conditions for each material instance and record damages.
 */
export const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  loan,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<InspectionItemInput[]>(
    loan.materialInstances.map((mi) => ({
      materialInstanceId: mi.materialInstanceId._id,
      condition: "good" as InspectionCondition,
      notes: "",
      damageDescription: "",
      damageCost: 0,
    })),
  );
  const [overallNotes, setOverallNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For material instance preview
  const [selectedInstance, setSelectedInstance] = useState<MaterialInstance | null>(null);
  const [loadingInstance, setLoadingInstance] = useState(false);

  // Material types map for enriching loan data
  const [materialTypesMap, setMaterialTypesMap] = useState<Record<string, MaterialType>>({});

  // Load material types on mount to enrich loan data with names
  useEffect(() => {
    const loadMaterialTypes = async () => {
      try {
        const res = await getMaterialTypes();
        const typeMap: Record<string, MaterialType> = {};
        (res.data.materialTypes || []).forEach((type) => {
          typeMap[type._id] = type;
        });
        setMaterialTypesMap(typeMap);
      } catch (err) {
        console.error("Failed to load material types:", err);
      }
    };
    loadMaterialTypes();
  }, []);;

  // Derive per-item description errors: required when damaged or lost
  const descriptionErrors = items.map(
    (item) =>
      (item.condition === "damaged" || item.condition === "lost") &&
      !validateDamageDescription(item.damageDescription ?? "").isValid,
  );
  const hasDescriptionErrors = descriptionErrors.some(Boolean);

  // Check if any item is damaged or lost (for conditional dueDate display)
  const hasDamagedOrLostItems = items.some(
    (item) => item.condition === "damaged" || item.condition === "lost",
  );

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

  const handleItemChange = <K extends keyof InspectionItemInput>(
    index: number,
    field: K,
    value: InspectionItemInput[K],
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        loanId: loan._id,
        items,
        overallNotes,
        ...(dueDate && { dueDate }),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || "Failed to save inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      data-help-id="inspections-form-create"
    >
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#333] flex items-center justify-between bg-[#1a1a1a] rounded-t-xl">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{t("inspections.performInspection")}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {t("inspections.loanIdLabel")}:{" "}
              <span className="text-gray-300 font-mono">{loan.code ?? loan._id}</span> •{" "}
              {t("inspections.customerLabel")}:{" "}
              <span className="text-gray-300">
                {`${loan.customerId.name.firstName} ${loan.customerId.name.firstSurname}`}
              </span>
            </p>
            {user && (
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-gray-400">{user.name.firstName} {user.name.firstSurname}</span>
                <span className="text-gray-600 mx-1">•</span>
                <span className="text-gray-500 text-[10px] uppercase tracking-tight">{user.roleName}</span>
                <span className="text-gray-600 mx-1">•</span>
                <span className="text-gray-400">{user.email}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#333] rounded-lg flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-6" data-help-id="inspections-form-items">
            <h3 className="text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
              {t("inspections.materialInstances")} ({loan.materialInstances.length})
            </h3>

            {loan.materialInstances.map((mi, index) => (
              <div
                key={mi.materialInstanceId._id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3 hover:border-[#333] transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2a2a2a] pb-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-white font-medium">
                        {(() => {
                          // Try to get material type name from API response first, then from loaded map
                          const typeName =
                            mi.materialType?.name ||
                            materialTypesMap[mi.materialTypeId]?.name;
                          
                          return typeName || mi.materialInstanceId.serialNumber;
                        })()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {t("inspections.serialNumber")}: <span className="font-mono text-gray-300">{mi.materialInstanceId.serialNumber}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewDetails(mi.materialInstanceId._id)}
                      disabled={loadingInstance}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t("inspections.viewMaterialInstance")}
                      aria-label={t("inspections.viewMaterialInstance")}
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                  <ConditionPicker
                    value={items[index].condition}
                    onChange={(val) => handleItemChange(index, "condition", val)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items[index].condition !== "good" && (
                    <>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                          {t("inspections.damageDescription")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          data-help-id="inspections-form-damage-description"
                          placeholder={t("inspections.damageDescriptionPlaceholder")}
                          className={`w-full bg-[#0a0a0a] border rounded-md px-3 py-2 text-sm text-white focus:outline-none min-h-[60px] ${
                            descriptionErrors[index]
                              ? "border-red-500 bg-red-500/10 focus:border-red-400"
                              : "border-[#333] focus:border-[#FFD700]"
                          }`}
                          value={items[index].damageDescription || ""}
                          onChange={(e) =>
                            handleItemChange(index, "damageDescription", e.target.value)
                          }
                          aria-invalid={descriptionErrors[index]}
                          aria-describedby={
                            descriptionErrors[index] ? `damage-desc-error-${index}` : undefined
                          }
                        />
                        {descriptionErrors[index] && (
                          <p
                            id={`damage-desc-error-${index}`}
                            className="text-red-400 text-xs mt-1"
                          >
                            {t("inspections.damageDescriptionRequired")}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                          {t("inspections.damageCost")}
                        </label>
                        <input
                          data-help-id="inspections-form-damage-cost"
                          type="number"
                          placeholder="0"
                          className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                          value={items[index].damageCost || 0}
                          onChange={(e) =>
                            handleItemChange(index, "damageCost", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </>
                  )}
                  <div
                    className={items[index].condition === "good" ? "col-span-2" : "md:col-span-1"}
                  >
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                      {t("inspections.itemNotes")}
                    </label>
                    <input
                      data-help-id="inspections-form-item-notes"
                      type="text"
                      placeholder={t("inspections.itemNotesPlaceholder")}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                      value={items[index].notes || ""}
                      onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#333] pt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                {t("inspections.overallNotes")}
              </label>
              <textarea
                data-help-id="inspections-form-overall-notes"
                placeholder={t("inspections.overallNotesPlaceholder")}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FFD700] min-h-[80px]"
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
              />
            </div>

            {hasDamagedOrLostItems && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-2">
                <label className="block text-sm font-semibold text-white uppercase tracking-wide">
                  {t("inspections.invoiceDueDate")}{" "}
                  <span className="text-gray-500 font-normal text-xs">
                    ({t("inspections.optional")})
                  </span>
                </label>
                <p className="text-xs text-gray-400">{t("inspections.invoiceDueDateHelp")}</p>
                <input
                  data-help-id="inspections-form-due-date"
                  type="datetime-local"
                  placeholder={t("inspections.selectDueDate")}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-[#333] flex items-center justify-end space-x-3 bg-[#1a1a1a] rounded-b-xl">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            data-help-id="inspections-form-cancel"
            className="border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
          >
            {t("inspections.cancel")}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || hasDescriptionErrors}
            data-help-id="inspections-form-submit"
            className="bg-[#FFD700] text-black hover:bg-[#e6c200] font-bold"
          >
            {isSubmitting ? t("inspections.saving") : t("inspections.completeInspection")}
            <Save size={18} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Material Instance Detail Preview */}
      {selectedInstance && (
        <MaterialInstanceDetailModal
          instance={selectedInstance}
          loanCode={loan.code || loan._id}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};
