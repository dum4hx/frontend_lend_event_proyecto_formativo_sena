import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../contexts/ToastContext';
import type { CreateMaterialTypePayload, MaterialCategory } from '../../../../../types/api';

interface MaterialTypeFormProps {
  categories: MaterialCategory[];
  onSubmit: (data: CreateMaterialTypePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialTypePayload> & { name?: string };
  isEditing?: boolean;
}

export const MaterialTypeForm: React.FC<MaterialTypeFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateMaterialTypePayload>({
    name: '',
    description: '',
    categoryId: '',
    pricePerDay: 0,
  });
  const [priceDisplay, setPriceDisplay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const formatCop = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (initialData) {
      const categoryIdFromArray = Array.isArray(initialData.categoryId)
        ? (initialData.categoryId[0] as { _id?: string } | undefined)?._id
        : undefined;
      const categoryIdValue =
        typeof initialData.categoryId === 'string'
          ? initialData.categoryId
          : categoryIdFromArray ||
            (initialData as { categoryId?: { _id?: string } }).categoryId?._id ||
            (initialData as { category?: { _id?: string } }).category?._id ||
            '';

      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        categoryId: categoryIdValue,
        pricePerDay: initialData.pricePerDay || 0,
      });
      if (initialData.pricePerDay) {
        setPriceDisplay(formatCop(initialData.pricePerDay));
      } else {
        setPriceDisplay('');
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Material name is required');
      return;
    }
    if (!formData.categoryId) {
      showToast('error', 'Category is required');
      return;
    }
    if (formData.pricePerDay <= 0) {
      showToast('error', 'Price per day must be greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting material type:', formData);
      await onSubmit(formData);
    } catch (error: any) {
      console.error('Error saving material type:', error);
      const errorMessage = error.details?.errors?.[0]?.message || error.message || 'Error saving material type';
      showToast('error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category * </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Material Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          placeholder="e.g., Aluminum Chair, LED Lighting..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Price per Day (COP) *
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={priceDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            const numericValue = raw ? parseInt(raw, 10) : 0;
            setFormData({ ...formData, pricePerDay: numericValue });
            setPriceDisplay(raw ? formatCop(numericValue) : '');
          }}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          placeholder="Ej: $ 15.000"
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
          placeholder="Detailed description of this material type..."
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
            ? 'Update Material Type'
            : 'Create Material Type'}
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
