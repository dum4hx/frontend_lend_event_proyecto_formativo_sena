import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../contexts/ToastContext';
import type { CreateMaterialCategoryPayload } from '../../../../../types/api';

interface CategoryFormProps {
  onSubmit: (data: CreateMaterialCategoryPayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialCategoryPayload> & { name?: string };
  isEditing?: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateMaterialCategoryPayload>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error: any) {
      showToast('error', error.message || 'Error saving category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          placeholder="e.g., Chairs, Tables, Lighting..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          placeholder="Brief description of this category..."
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 font-semibold rounded-lg transition-colors gold-action-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
            ? 'Update Category'
            : 'Create Category'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 bg-[#1a1a1a] text-gray-300 font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#333] disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
