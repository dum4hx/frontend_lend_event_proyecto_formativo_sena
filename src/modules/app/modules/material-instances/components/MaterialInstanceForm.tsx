import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../../../../../contexts/ToastContext";
import { useMaterialTypes } from "../../material-types/hooks";
import {
  getLocations,
  type WarehouseLocation,
} from "../../../../../services/warehouseOperatorService";
import type { CreateMaterialInstancePayload } from "../../../../../types/api";

interface MaterialInstanceFormProps {
  onSubmit: (data: CreateMaterialInstancePayload) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateMaterialInstancePayload>;
  isEditing?: boolean;
}

export const MaterialInstanceForm: React.FC<MaterialInstanceFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const { materialTypes } = useMaterialTypes();
  const [formData, setFormData] = useState<CreateMaterialInstancePayload>({
    modelId: "",
    serialNumber: "",
    locationId: "",
  });
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const fetchLocations = useCallback(async () => {
    try {
      const response = await getLocations();
      setLocations(response.data.items || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      showToast("error", "Failed to load locations");
    }
  }, [showToast]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        modelId: initialData.modelId || "",
        serialNumber: initialData.serialNumber || "",
        locationId: initialData.locationId || "",
      });
    }
  }, [initialData]);

  const validate = useCallback((data: CreateMaterialInstancePayload) => {
    const newErrors: Record<string, string> = {};
    if (!data.modelId) newErrors.modelId = "Material type is required";
    if (!data.serialNumber.trim()) {
      newErrors.serialNumber = "Serial number is required";
    } else if (data.serialNumber.length > 100) {
      newErrors.serialNumber = "Serial number must be under 100 characters";
    }
    if (!data.locationId) newErrors.locationId = "Location is required";
    return newErrors;
  }, []);

  useEffect(() => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);
  }, [formData, validate]);

  const handleChange = (field: keyof CreateMaterialInstancePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    setTouched({
      modelId: true,
      serialNumber: true,
      locationId: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      showToast("error", "Please fix the errors before submitting");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error: unknown) {
      showToast("error", error instanceof Error ? error.message : "Error saving material instance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Material Type *</label>
        <select
          value={formData.modelId}
          onChange={(e) => handleChange("modelId", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, modelId: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.modelId && errors.modelId ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700]`}
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
        {touched.modelId && errors.modelId && (
          <p className="text-xs text-red-500 mt-1">{errors.modelId}</p>
        )}
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
          onChange={(e) => handleChange("serialNumber", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, serialNumber: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.serialNumber && errors.serialNumber ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700]`}
          placeholder="e.g., SN-001, CHAIR-A-01..."
          required
          maxLength={100}
        />
        {touched.serialNumber && errors.serialNumber && (
          <p className="text-xs text-red-500 mt-1">{errors.serialNumber}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Unique identifier for this specific item (max 100 characters)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
        <select
          value={formData.locationId}
          onChange={(e) => handleChange("locationId", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, locationId: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.locationId && errors.locationId ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700]`}
          required
        >
          <option value="">Select a location</option>
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>
              {loc.name} — {loc.address.city}, {loc.address.street} {loc.address.propertyNumber}
            </option>
          ))}
        </select>
        {touched.locationId && errors.locationId && (
          <p className="text-xs text-red-500 mt-1">{errors.locationId}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 font-semibold rounded-lg transition-colors gold-action-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
              ? "Update Instance"
              : "Create Instance"}
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
