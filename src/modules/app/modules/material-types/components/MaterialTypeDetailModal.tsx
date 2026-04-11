import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { MaterialCategory, MaterialType, MaterialAttribute } from "../../../../../types/api";
import { useLanguage } from "../../../../../contexts/useLanguage";

interface MaterialTypeDetailModalProps {
  materialType: MaterialType;
  categories: MaterialCategory[];
  attributes?: MaterialAttribute[];
  onClose: () => void;
}

export const MaterialTypeDetailModal: React.FC<MaterialTypeDetailModalProps> = ({
  materialType,
  categories,
  attributes = [],
  onClose,
}) => {
  const { language } = useLanguage();
  const isEs = language === "es";

  const extractCategoryIds = (value: unknown): string[] => {
    // Array of strings
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const id = (item as { _id?: string })._id;
            return typeof id === "string" ? id : undefined;
          }
          return undefined;
        })
        .filter((id): id is string => !!id);
    }

    // Single string ID
    if (typeof value === "string") return [value];

    // Single populated object
    if (value && typeof value === "object") {
      const maybeId = (value as { _id?: string })._id;
      return typeof maybeId === "string" ? [maybeId] : [];
    }

    return [];
  };

  const getCategoryNames = (typeData: Partial<MaterialType>): string[] => {
    const categoryIds = extractCategoryIds(typeData.categoryId);
    return categoryIds
      .map((id) => categories.find((c) => c._id === id)?.name)
      .filter((name): name is string => !!name)
      .sort();
  };

  const getAttributeDisplayLabel = (attributeId: string): string => {
    const attr = attributes.find((a) => a._id === attributeId);
    if (!attr) return attributeId;
    return attr.unit ? `${attr.name} (${attr.unit})` : attr.name;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {isEs ? "Detalles del tipo de material" : "Material Type Details"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
            aria-label={isEs ? "Cerrar detalle" : "Close details"}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {isEs ? "Nombre del material" : "Material Name"}
              </label>
              <p className="text-white font-semibold text-lg">{materialType.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {isEs ? "Precio por día" : "Price per Day"}
              </label>
              <p className="text-[#FFD700] font-bold text-xl">
                {formatPrice(materialType.pricePerDay)}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {isEs ? "Descripción" : "Description"}
            </label>
            <p className="text-white">
              {materialType.description ||
                (isEs ? "Sin descripción registrada" : "No description provided")}
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              {isEs ? "Categorías" : "Categories"}
            </label>
            {getCategoryNames(materialType).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {getCategoryNames(materialType).map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] rounded-lg text-sm font-medium"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {isEs ? "Sin categorías asignadas" : "No categories assigned"}
              </p>
            )}
          </div>

          {/* Attributes */}
          {materialType.attributes && materialType.attributes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                {isEs ? "Especificaciones técnicas" : "Technical Specifications"}
              </label>
              <div className="space-y-2">
                {materialType.attributes.map((attr) => (
                  <div
                    key={attr.attributeId}
                    className="p-3 bg-[#1a1a1a] border border-[#222] rounded-lg flex items-start justify-between gap-4"
                  >
                    <span className="text-gray-300 font-medium">
                      {getAttributeDisplayLabel(attr.attributeId)}
                    </span>
                    <span className="text-white font-semibold">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {isEs ? "Código del tipo" : "Type Code"}
            </label>
            <p className="text-gray-400 text-sm font-mono">{materialType.code || "N/A"}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
          >
            {isEs ? "Cerrar" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
