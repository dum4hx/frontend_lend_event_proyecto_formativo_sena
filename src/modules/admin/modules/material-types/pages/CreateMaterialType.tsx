import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMaterialTypes } from '../hooks';
import { useCategories } from '../../material-categories/hooks';
import { MaterialTypeForm } from '../components';
import { useToast } from '../../../../../contexts/ToastContext';
import type { CreateMaterialTypePayload } from '../../../../../types/api';

export const CreateMaterialType: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addMaterialType, updateMaterialType } = useMaterialTypes();
  const { categories, loading: categoriesLoading } = useCategories();
  const { showToast } = useToast();

  const editingMaterialType = location.state?.materialType;
  const isEditing = !!editingMaterialType;

  const handleSubmit = async (data: CreateMaterialTypePayload) => {
    try {
      if (isEditing) {
        await updateMaterialType(editingMaterialType._id, data);
        showToast('success', 'Material type updated successfully!');
      } else {
        await addMaterialType(data);
        showToast('success', 'Material type created successfully!');
      }
      navigate('/admin/material-types');
    } catch (error: any) {
      showToast('error', error.message || 'Error saving material type');
      throw error;
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/material-types')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Material Types
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing ? 'Edit Material Type' : 'Create New Material Type'}
          </h1>
          <p className="text-gray-400">
            {isEditing
              ? 'Update the material type information below'
              : 'Add a new material type to your catalog'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <MaterialTypeForm
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/admin/material-types')}
            initialData={editingMaterialType}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};
