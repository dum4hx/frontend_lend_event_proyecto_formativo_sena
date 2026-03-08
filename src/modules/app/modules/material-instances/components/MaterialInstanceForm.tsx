import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../../contexts/ToastContext';
import type { CreateMaterialInstancePayload, MaterialType } from '../../../../../types/api';

interface MaterialInstanceFormProps {
  materialTypes: MaterialType[];
  onSubmit: (data: CreateMaterialInstancePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialInstancePayload> & { serialNumber?: string };
  isEditing?: boolean;
}

export const MaterialInstanceForm: React.FC<MaterialInstanceFormProps> = ({
  materialTypes,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateMaterialInstancePayload>({
    modelId: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseCost: undefined,
  });
  const [purchaseCostDisplay, setPurchaseCostDisplay] = useState('');
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
      setFormData({
        modelId: initialData.modelId || '',
        serialNumber: initialData.serialNumber || '',
        purchaseDate: initialData.purchaseDate || '',
        purchaseCost: initialData.purchaseCost,
      });
      if (initialData.purchaseCost) {
        setPurchaseCostDisplay(formatCop(initialData.purchaseCost));
      } else {
        setPurchaseCostDisplay('');
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelId) {
      showToast('error', 'Material type is required');
      return;
    }
    if (!formData.serialNumber.trim()) {
      showToast('error', 'Serial number is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error: any) {
      showToast('error', error.message || 'Error saving material instance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Material Type *
        </label>
        <select
          value={formData.modelId}
          onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          required
          disabled={isEditing}
        >
          <option value="">Select a material type</option>
          {materialTypes.map((type) => (
            <option key={type._id} value={type._id}>
              {type.name}
            </option>
          ))}
        </select>
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1">
            Material type cannot be changed after creation
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Serial Number / Identifier *
        </label>
        <input
          type="text"
          value={formData.serialNumber}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          placeholder="e.g., SN-001, CHAIR-A-01..."
          required
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          Unique identifier for this specific item (max 100 characters)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Purchase Date
          </label>
          <input
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Purchase Cost (COP)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={purchaseCostDisplay}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              const numericValue = raw ? parseInt(raw, 10) : undefined;
              setFormData({ ...formData, purchaseCost: numericValue });
              setPurchaseCostDisplay(raw ? formatCop(parseInt(raw, 10)) : '');
            }}
            className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700]"
            placeholder="Ej: $ 150.000"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-[#FFC700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditing
              ? 'Updating...'
              : 'Creating...'
            : isEditing
            ? 'Update Instance'
            : 'Create Instance'}
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
