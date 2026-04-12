import React, { useState, useEffect } from "react";
import { X, Info, RefreshCw } from "lucide-react";
import {
  type MaterialInstance,
  type MaterialAttribute,
  type MaterialType,
} from "../../../../../types/api";
import type { WarehouseLocation } from "../../../../../services/warehouseOperatorService";
import { getMaterialInstanceStatusLabel } from "../../../../../utils/statusLabels";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { MaterialBarcode } from "./MaterialBarcode";
import { getMaterialAttributes, getMaterialTypes } from "../../../../../services/materialService";
import { getLocation } from "../../../../../services/warehouseOperatorService";
import { EntityLink } from "../../../../../components/ui";

interface MaterialInstanceDetailModalProps {
  instance: MaterialInstance;
  onClose: () => void;
  loanCode?: string;
  isLoanCodeLoading?: boolean;
  onRefreshData?: (instance: MaterialInstance) => Promise<MaterialInstance | null>;
}

export const MaterialInstanceDetailModal: React.FC<MaterialInstanceDetailModalProps> = ({
  instance,
  onClose,
  loanCode,
  isLoanCodeLoading = false,
  onRefreshData,
}) => {
  const { language, t } = useLanguage();
  const [attributeDefinitions, setAttributeDefinitions] = useState<MaterialAttribute[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [location, setLocation] = useState<WarehouseLocation | null>(null);

  useEffect(() => {
    async function loadResources() {
      setLoadingAttributes(true);
      try {
        const [attrRes, typeRes] = await Promise.all([getMaterialAttributes(), getMaterialTypes()]);
        setAttributeDefinitions(attrRes.data.attributes);
        setMaterialTypes(typeRes.data.materialTypes || []);
      } catch (error) {
        console.error("Failed to load material resources:", error);
      } finally {
        setLoadingAttributes(false);
      }
    }
    loadResources();
  }, []);

  // Load location if name is missing
  useEffect(() => {
    if (instance.locationId?._id && !instance.locationId?.name) {
      const loadLocationData = async () => {
        try {
          const res = await getLocation(instance.locationId._id);
          setLocation(res.data);
        } catch (error) {
          console.error("Failed to load location:", error);
        }
      };
      loadLocationData();
    }
  }, [instance.locationId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        await onRefreshData(instance);
      } else {
        // Reload attributes and material types
        const [attrRes, typeRes] = await Promise.all([getMaterialAttributes(), getMaterialTypes()]);
        setAttributeDefinitions(attrRes.data.attributes);
        setMaterialTypes(typeRes.data.materialTypes || []);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use instance attributes if present, otherwise fallback to material type attributes
  const typeAttributes = materialTypes.find((t) => t._id === instance.model?._id)?.attributes || [];
  const activeAttributes =
    instance.attributes && instance.attributes.length > 0 ? instance.attributes : typeAttributes;

  const resolvedCode = instance.barcode?.trim() || instance.serialNumber.trim();
  const shouldShowLoanCode = instance.status === "loaned" || instance.status === "reserved";

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "text-green-400",
      reserved: "text-blue-400",
      loaned: "text-yellow-400",
      returned: "text-purple-400",
      maintenance: "text-orange-400",
      damaged: "text-red-400",
      lost: "text-red-600",
      retired: "text-gray-500",
    };
    return colors[status] || "text-gray-400";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t("materialInstances.detail.title")}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("materialInstances.detail.refreshData")}
              aria-label={t("materialInstances.detail.refreshData")}
            >
              <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t("materialInstances.detail.serialNumber")}</label>
              <p className="text-white font-mono font-semibold text-lg">{instance.serialNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t("materialInstances.detail.status")}</label>
              <p className={`font-bold text-lg ${getStatusColor(instance.status)}`}>
                {getMaterialInstanceStatusLabel(instance.status, language)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#333] bg-[#171717] p-4">
            <label className="block text-sm font-medium text-gray-400 mb-3">{t("materialInstances.detail.barcode")}</label>
            <div className="rounded-lg bg-white p-4">
              <MaterialBarcode
                value={resolvedCode}
                fallbackValue={instance.serialNumber}
                height={72}
                width={1.6}
                showCodeLabel={false}
              />
            </div>
            {!instance.barcode && (
              <p className="mt-2 text-xs text-[#FFD700]">
                {t("materialInstances.detail.barcodeUsingSerial")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t("materialInstances.detail.materialType")}</label>
              <EntityLink
                entityType="materialType"
                entityId={instance.model?._id ?? ""}
                label={instance.model?.name || t("common.noResults")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t("materialInstances.detail.location")}</label>
              <EntityLink
                entityType="location"
                entityId={instance.locationId?._id ?? ""}
                label={location?.name?.trim() || instance.locationId?.name?.trim() ? location?.name ?? instance.locationId?.name : t("common.unknownLocation")}
              />
            </div>
          </div>

          {/* Attributes Section */}
          {activeAttributes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                <Info size={16} />
                <span>{t("materialInstances.detail.technicalSpecifications")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeAttributes.map((attr) => {
                  const definition = attributeDefinitions.find((d) => d._id === attr.attributeId);
                  return (
                    <div
                      key={attr.attributeId}
                      className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg flex flex-col"
                    >
                      <span className="text-xs text-gray-500 uppercase font-bold tracking-tight">
                        {definition?.name || "Attribute"}
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-white font-medium">{attr.value}</span>
                        {definition?.unit && (
                          <span className="text-gray-400 text-sm">{definition.unit}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {loadingAttributes && (
                <p className="text-xs text-gray-500 animate-pulse">{t("materialInstances.detail.loadingSpecifications")}</p>
              )}
            </div>
          )}

          {shouldShowLoanCode && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">{t("materialInstances.detail.loanCode")}</label>
              <p className="text-gray-400 text-sm font-mono">
                {isLoanCodeLoading
                  ? `${t("common.loading")}...`
                  : loanCode || t("materialInstances.detail.notAssigned")}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
          >
            {t("materialInstances.detail.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
