import { useState, useEffect } from 'react';
import {
  getMaterialTypes,
  createMaterialType,
  updateMaterialType,
  deleteMaterialType,
} from '../../../../../services/materialService';
import type {
  MaterialType,
  CreateMaterialTypePayload,
  UpdateMaterialTypePayload,
} from '../../../../../types/api';

export function useMaterialTypes() {
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterialTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMaterialTypes();
      setMaterialTypes(response.data.materialTypes || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching material types');
      console.error('Error fetching material types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialTypes();
  }, []);

  const addMaterialType = async (payload: CreateMaterialTypePayload) => {
    console.log('Creating material type with payload:', payload);
    const response = await createMaterialType(payload);
    console.log('Material type created successfully:', response.data.materialType);
    setMaterialTypes((prev) => [...prev, response.data.materialType]);
    return response.data.materialType;
  };

  const updateMaterialTypeData = async (
    typeId: string,
    payload: UpdateMaterialTypePayload
  ) => {
    const response = await updateMaterialType(typeId, payload);
    setMaterialTypes((prev) =>
      prev.map((type) =>
        type._id === typeId ? response.data.materialType : type
      )
    );
    return response.data.materialType;
  };

  const removeMaterialType = async (typeId: string) => {
    await deleteMaterialType(typeId);
    setMaterialTypes((prev) => prev.filter((type) => type._id !== typeId));
  };

  return {
    materialTypes,
    loading,
    error,
    refetch: fetchMaterialTypes,
    addMaterialType,
    updateMaterialType: updateMaterialTypeData,
    removeMaterialType,
  };
}
