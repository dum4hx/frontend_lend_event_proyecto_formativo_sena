import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "../../../../../contexts/ToastContext";
import type { CreateMaterialCategoryPayload } from "../../../../../types/api";
import { Button } from "../../../../../components/ui";
import { validateCategoryName, validateCategoryDescription } from "../../../../../utils/validators";

interface CategoryFormProps {
  onSubmit: (data: CreateMaterialCategoryPayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialCategoryPayload> & { name?: string };
  isEditing?: boolean;
}

type CategoryFormField = "name" | "description";

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateMaterialCategoryPayload>({
    name: "",
    description: "",
  });
  const [touched, setTouched] = useState<Record<CategoryFormField, boolean>>({
    name: false,
    description: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const fieldErrors = useMemo(() => {
    const errors: Record<CategoryFormField, string | null> = {
      name: null,
      description: null,
    };

    if (touched.name) {
      const validation = validateCategoryName(formData.name);
      if (!validation.isValid) {
        errors.name = validation.message ?? "Invalid category name";
      }
    }

    if (touched.description) {
      const validation = validateCategoryDescription(formData.description);
      if (!validation.isValid) {
        errors.description = validation.message ?? "Invalid description";
      }
    }

    return errors;
  }, [formData, touched]);

  const isFormValid = useMemo(() => {
    const nameValidation = validateCategoryName(formData.name);
    const descriptionValidation = validateCategoryDescription(formData.description);
    return nameValidation.isValid && descriptionValidation.isValid;
  }, [formData]);

  const handleBlur = (field: CategoryFormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      name: true,
      description: true,
    });

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      const err = error as Error;
      showToast("error", err.message || "Error saving category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          onBlur={() => handleBlur("name")}
          maxLength={100}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-white focus:outline-none transition-colors ${
            touched.name && fieldErrors.name
              ? "border-red-500 focus:border-red-500"
              : "border-[#333] focus:border-[#FFD700]"
          }`}
          placeholder="e.g., Chairs, Tables, Lighting..."
          disabled={isSubmitting}
        />
        {touched.name && fieldErrors.name && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{formData.name.length}/100 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          onBlur={() => handleBlur("description")}
          maxLength={500}
          rows={4}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border rounded-lg text-white focus:outline-none transition-colors resize-none ${
            touched.description && fieldErrors.description
              ? "border-red-500 focus:border-red-500"
              : "border-[#333] focus:border-[#FFD700]"
          }`}
          placeholder="Brief description of this category..."
          disabled={isSubmitting}
        />
        {touched.description && fieldErrors.description && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {(formData.description ?? "").length}/500 characters
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || !isFormValid}
          className="flex-1"
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Category"
              : "Create Category"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
