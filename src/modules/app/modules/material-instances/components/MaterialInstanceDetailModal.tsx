import React, { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import {
  type MaterialInstance,
  type MaterialAttribute,
  type MaterialType,
} from "../../../../../types/api";
import { getMaterialInstanceStatusLabel } from "../../../../../utils/statusLabels";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { MaterialBarcode } from "./MaterialBarcode";
import { getMaterialAttributes, getMaterialTypes } from "../../../../../services/materialService";
import { EntityLink } from "../../../../../components/ui";

interface MaterialInstanceDetailModalProps {
  instance: MaterialInstance;
  onClose: () => void;
}

export const MaterialInstanceDetailModal: React.FC<MaterialInstanceDetailModalProps> = ({
  instance,
  onClose,
}) => {
  const { language } = useLanguage();
  const [attributeDefinitions, setAttributeDefinitions] = useState<MaterialAttribute[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

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

  // Use instance attributes if present, otherwise fallback to material type attributes
  const typeAttributes = materialTypes.find((t) => t._id === instance.model?._id)?.attributes || [];
  const activeAttributes =
    instance.attributes && instance.attributes.length > 0 ? instance.attributes : typeAttributes;

  const resolvedCode = instance.barcode?.trim() || instance.serialNumber.trim();

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
          <h2 className="text-2xl font-bold text-white">Material Instance Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Serial Number</label>
              <p className="text-white font-mono font-semibold text-lg">{instance.serialNumber}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
              <p className={`font-bold text-lg ${getStatusColor(instance.status)}`}>
                {getMaterialInstanceStatusLabel(instance.status, language)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#333] bg-[#171717] p-4">
            <label className="block text-sm font-medium text-gray-400 mb-3">Barcode</label>
            <div className="rounded-lg bg-white p-4">
              <MaterialBarcode
                value={resolvedCode}
                fallbackValue={instance.serialNumber}
                height={72}
                width={1.6}
                showCodeLabel={false}
              />
            </div>
            <p className="mt-3 text-white font-mono break-all">{resolvedCode || "Not assigned"}</p>
            {!instance.barcode && (
              <p className="mt-2 text-xs text-[#FFD700]">
                Using serial number as barcode fallback.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Material Type</label>
              <EntityLink
                entityType="materialType"
                entityId={instance.model?._id ?? ""}
                label={instance.model?.name || "Unknown"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
              <EntityLink
                entityType="location"
                entityId={instance.locationId?._id ?? ""}
                label={instance.locationId?.name || "Unknown"}
              />
            </div>
          </div>

          {/* Attributes Section */}
          {activeAttributes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700] uppercase tracking-wider">
                <Info size={16} />
                <span>Technical Specifications</span>
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
                <p className="text-xs text-gray-500 animate-pulse">Loading specifications...</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Instance ID</label>
            <p className="text-gray-400 text-sm font-mono">{instance._id}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
