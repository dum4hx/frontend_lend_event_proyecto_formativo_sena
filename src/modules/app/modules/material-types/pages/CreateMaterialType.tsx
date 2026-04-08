import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useMaterialTypes } from "../hooks";
import { useCategories } from "../../material-categories/hooks";
import { MaterialTypeForm } from "../components";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type { CreateMaterialTypePayload } from "../../../../../types/api";

export const CreateMaterialType: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { addMaterialType, updateMaterialType } = useMaterialTypes();
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const { showToast } = useToast();

  const editingMaterialType = location.state?.materialType;
  const isEditing = !!editingMaterialType;
  const hasCategories = categories.length > 0;

  const handleSubmit = async (data: CreateMaterialTypePayload) => {
    try {
      if (isEditing) {
        await updateMaterialType(editingMaterialType._id, data);
        showToast("success", t("materialTypes.toast.updateSuccess"));
      } else {
        await addMaterialType(data);
        showToast("success", t("materialTypes.toast.createSuccess"));
      }
      navigate("/app/material-types");
    } catch (error) {
      const err = error as Error;
      showToast("error", err.message || t("materialTypes.toast.saveError"));
      throw err;
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">{t("materialTypes.page.loadingCategories")}</div>
      </div>
    );
  }

  if (!isEditing && !hasCategories) {
    return (
      <div className="min-h-screen bg-[#121212] p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate("/app/material-types")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            {t("materialTypes.page.backToMaterialTypes")}
          </button>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-[#FFD700] mt-0.5" size={22} />
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {t("materialTypes.page.noCategoryTitle")}
                </h1>
                <p className="text-gray-300">{t("materialTypes.page.noCategoryDescription")}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/app/material-categories")}
                className="px-5 py-2.5 font-semibold rounded-lg transition-colors gold-action-btn"
              >
                {t("materialTypes.page.goToCategoryCatalog")}
              </button>
              <button
                onClick={() => navigate("/app/material-types")}
                className="px-5 py-2.5 bg-transparent text-gray-300 border border-[#333] rounded-lg hover:bg-[#222] transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/app/material-types")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t("materialTypes.page.backToMaterialTypes")}
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing ? t("materialTypes.page.editTitle") : t("materialTypes.page.createTitle")}
          </h1>
          <p className="text-gray-400">
            {isEditing
              ? t("materialTypes.page.editSubtitle")
              : t("materialTypes.page.createSubtitle")}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <MaterialTypeForm
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/material-types")}
            initialData={editingMaterialType}
            isEditing={isEditing}
            onCategoryCreated={() => void refetchCategories()}
          />
        </div>
      </div>
    </div>
  );
};
