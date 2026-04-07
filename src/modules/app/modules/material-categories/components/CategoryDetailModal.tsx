import React, { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import type { MaterialCategory, MaterialAttribute } from "../../../../../types/api";
import { getMaterialAttributes } from "../../../../../services/materialService";
import { useLanguage } from "../../../../../contexts/useLanguage";

interface CategoryDetailModalProps {
  category: MaterialCategory;
  onClose: () => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({ category, onClose }) => {
  const [attributes, setAttributes] = useState<MaterialAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setLoading(true);
        const response = await getMaterialAttributes();
        setAttributes(response.data.attributes || []);
        setError(null);
      } catch (err) {
        setError(t("materialCategories.detail.failedToLoadAttributes"));
        console.error("Error fetching attributes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [t]);

  const getCategoryAttributes = () => {
    return category.attributes
      .map((catAttr) => {
        const attribute = attributes.find((attr) => attr._id === catAttr.attributeId);
        return {
          ...catAttr,
          attribute,
        };
      })
      .filter((item) => item.attribute);
  };

  const categoryAttributes = getCategoryAttributes();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t("materialCategories.detail.title")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("materialCategories.detail.categoryName")}
              </label>
              <p className="text-white font-semibold text-lg">{category.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("materialCategories.form.categoryCode")}
              </label>
              <p className="text-white font-semibold text-lg font-mono">{category.code}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("materialCategories.detail.description")}
            </label>
            <p className="text-white">
              {category.description || t("materialCategories.detail.noDescription")}
            </p>
          </div>

          {/* Attributes Section */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-4">
              {t("materialCategories.detail.attributesCount", {
                count: String(categoryAttributes.length),
              })}
            </label>

            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border border-[#333] border-t-[#FFD700]"></div>
              </div>
            ) : categoryAttributes.length === 0 ? (
              <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg text-center text-gray-400">
                {t("materialCategories.detail.noAttributes")}
              </div>
            ) : (
              <div className="space-y-3">
                {categoryAttributes.map((item) => (
                  <div
                    key={item.attributeId}
                    className="p-4 bg-[#1a1a1a] border border-[#333] rounded-lg hover:border-[#444] transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-start">
                      {/* Attribute Name */}
                      <div className="col-span-5">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          {t("materialCategories.detail.attributeName")}
                        </p>
                        <p className="text-white font-medium">
                          {item.attribute?.name || t("materialCategories.detail.unknown")}
                        </p>
                      </div>

                      {/* Unit */}
                      <div className="col-span-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          {t("materialCategories.detail.unit")}
                        </p>
                        <p className="text-white">{item.attribute?.unit || "—"}</p>
                      </div>

                      {/* Required */}
                      <div className="col-span-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                          {t("materialCategories.detail.required")}
                        </p>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            item.isRequired
                              ? "bg-red-900/30 text-red-300 border border-red-700"
                              : "bg-green-900/30 text-green-300 border border-green-700"
                          }`}
                        >
                          {item.isRequired
                            ? t("materialCategories.detail.yes")
                            : t("materialCategories.detail.no")}
                        </span>
                      </div>
                    </div>

                    {/* Allowed Values */}
                    {item.attribute?.allowedValues && item.attribute.allowedValues.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#333]">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {t("materialCategories.detail.allowedValues")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.attribute.allowedValues.map((value, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#222] border border-[#444] text-gray-300 text-xs rounded"
                            >
                              {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#333] p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[#1a1a1a] text-white font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333]"
          >
            {t("materialCategories.detail.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
