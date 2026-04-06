import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "../hooks";
import { CategoryForm } from "../components";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type { CreateMaterialCategoryPayload } from "../../../../../types/api";

export const CreateCategory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addCategory, updateCategory } = useCategories();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const editingCategory = location.state?.category;
  const isEditing = !!editingCategory;

  const handleSubmit = async (data: CreateMaterialCategoryPayload) => {
    try {
      if (isEditing) {
        await updateCategory(editingCategory._id, data);
        showToast("success", t("materialCategories.toast.updateSuccess"));
      } else {
        await addCategory(data);
        showToast("success", t("materialCategories.toast.createSuccess"));
      }
      navigate("/app/material-categories");
    } catch (error) {
      const err = error as Error;
      showToast("error", err.message || t("materialCategories.toast.saveError"));
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/app/material-categories")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t("materialCategories.backToCategories")}
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing
              ? t("materialCategories.editCategory")
              : t("materialCategories.createNewCategory")}
          </h1>
          <p className="text-gray-400">
            {isEditing
              ? t("materialCategories.editDescription")
              : t("materialCategories.createDescription")}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <CategoryForm
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/material-categories")}
            initialData={editingCategory}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};
