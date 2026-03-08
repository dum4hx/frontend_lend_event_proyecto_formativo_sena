import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCategories } from "../hooks";
import { CategoryForm } from "../components";
import { useToast } from "../../../../../contexts/ToastContext";
import type { CreateMaterialCategoryPayload } from "../../../../../types/api";

export const CreateCategory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addCategory, updateCategory } = useCategories();
  const { showToast } = useToast();

  const editingCategory = location.state?.category;
  const isEditing = !!editingCategory;

  const handleSubmit = async (data: CreateMaterialCategoryPayload) => {
    try {
      if (isEditing) {
        await updateCategory(editingCategory._id, data);
        showToast("success", "Category updated successfully!");
      } else {
        await addCategory(data);
        showToast("success", "Category created successfully!");
      }
      navigate("/app/material-categories");
    } catch (error: any) {
      showToast("error", error.message || "Error saving category");
      throw error;
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
          Back to Categories
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing ? "Edit Category" : "Create New Category"}
          </h1>
          <p className="text-gray-400">
            {isEditing
              ? "Update the category information below"
              : "Add a new material category to your catalog"}
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
