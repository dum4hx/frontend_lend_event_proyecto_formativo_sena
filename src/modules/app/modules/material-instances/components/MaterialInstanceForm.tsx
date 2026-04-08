import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { useMaterialTypes } from "../../material-types/hooks";
import {
  getLocations,
  type WarehouseLocation,
} from "../../../../../services/warehouseOperatorService";
import type { CreateMaterialInstancePayload } from "../../../../../types/api";
import { Button } from "../../../../../components/ui";

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
  const { t } = useLanguage();
  const [useBarcodeAsSerial, setUseBarcodeAsSerial] = useState(false);
  const [formData, setFormData] = useState<CreateMaterialInstancePayload>({
    modelId: "",
    serialNumber: "",
    barcode: "",
    locationId: "",
  });
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const formatLocationAddress = useCallback((location: WarehouseLocation) => {
    const address = location.address;
    const city = address.city ?? "Unknown city";
    const formattedStreet =
      address.formatted ||
      [address.streetType, address.primaryNumber, address.secondaryNumber, address.complementaryNumber]
        .filter(Boolean)
        .join(" ");

    return `${city}${formattedStreet ? `, ${formattedStreet}` : ""}`;
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await getLocations();
      setLocations(response.data.items || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
      showToast("error", t("materialInstances.form.toast.loadLocationsError"));
    }
  }, [showToast]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  useEffect(() => {
    if (initialData) {
      const initialBarcode = initialData.barcode || "";
      const initialSerial = initialData.serialNumber || "";
      const shouldUseBarcodeAsSerial = Boolean(initialBarcode && !initialSerial);
      setUseBarcodeAsSerial(shouldUseBarcodeAsSerial);
      setFormData({
        modelId: initialData.modelId || "",
        serialNumber: shouldUseBarcodeAsSerial ? initialBarcode : initialSerial,
        barcode: initialBarcode,
        locationId: initialData.locationId || "",
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (!useBarcodeAsSerial) {
      return;
    }

    setFormData((prev) => {
      const nextSerial = (prev.barcode || "").trim();
      if (prev.serialNumber === nextSerial) {
        return prev;
      }

      return {
        ...prev,
        serialNumber: nextSerial,
      };
    });
  }, [formData.barcode, useBarcodeAsSerial]);

  const validate = useCallback((data: CreateMaterialInstancePayload) => {
    const newErrors: Record<string, string> = {};
    if (!data.modelId) newErrors.modelId = t("materialInstances.form.validation.modelRequired");
    if (useBarcodeAsSerial && !data.barcode?.trim()) {
      newErrors.barcode = t("materialInstances.form.validation.barcodeRequiredForSerial");
    }
    if (!data.serialNumber.trim()) {
      newErrors.serialNumber = useBarcodeAsSerial
        ? t("materialInstances.form.validation.serialRequiredFromBarcode")
        : t("materialInstances.form.validation.serialRequired");
    } else if (data.serialNumber.length > 100) {
      newErrors.serialNumber = t("materialInstances.form.validation.serialTooLong");
    }
    if (data.barcode && data.barcode.length > 120) {
      newErrors.barcode = t("materialInstances.form.validation.barcodeTooLong");
    }
    if (!data.locationId) newErrors.locationId = t("materialInstances.form.validation.locationRequired");
    return newErrors;
  }, [useBarcodeAsSerial]);

  useEffect(() => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);
  }, [formData, validate]);

  const handleChange = (field: keyof CreateMaterialInstancePayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBarcodeAsSerialToggle = (enabled: boolean) => {
    setUseBarcodeAsSerial(enabled);
    setTouched((prev) => ({
      ...prev,
      barcode: true,
      serialNumber: true,
    }));

    if (enabled) {
      setFormData((prev) => ({
        ...prev,
        serialNumber: (prev.barcode || "").trim(),
      }));
    }
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
      showToast("error", t("materialInstances.form.toast.validationErrors"));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error: unknown) {
      showToast("error", error instanceof Error ? error.message : t("materialInstances.form.toast.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      data-help-id={isEditing ? "material-instances-form-edit" : "material-instances-form-create"}
    >
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{t("materialInstances.form.materialTypeLabel")} *</label>
        <select
          data-help-id="material-instances-form-model"
          value={formData.modelId}
          onChange={(e) => handleChange("modelId", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, modelId: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.modelId && errors.modelId ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700]`}
          required
          disabled={isEditing}
        >
          <option value="">{t("materialInstances.form.selectMaterialType")}</option>
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
            {t("materialInstances.form.materialTypeCannotChange")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t("materialInstances.form.serialLabel")} *
        </label>
        <input
          type="text"
          data-help-id="material-instances-form-serial"
          value={formData.serialNumber}
          onChange={(e) => handleChange("serialNumber", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, serialNumber: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.serialNumber && errors.serialNumber ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700] disabled:opacity-60 disabled:cursor-not-allowed`}
          placeholder={t("materialInstances.form.serialPlaceholder")}
          required
          maxLength={100}
          disabled={useBarcodeAsSerial}
        />
        {touched.serialNumber && errors.serialNumber && (
          <p className="text-xs text-red-500 mt-1">{errors.serialNumber}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {useBarcodeAsSerial
            ? t("materialInstances.form.serialHintAuto")
            : t("materialInstances.form.serialHint")}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t("materialInstances.form.barcodeLabel")}
        </label>
        <input
          type="text"
          data-help-id="material-instances-form-barcode"
          value={formData.barcode ?? ""}
          onChange={(e) => handleChange("barcode", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, barcode: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.barcode && errors.barcode ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700]`}
          placeholder={t("materialInstances.form.barcodePlaceholder")}
          maxLength={120}
        />
        {touched.barcode && errors.barcode && (
          <p className="text-xs text-red-500 mt-1">{errors.barcode}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {t("materialInstances.form.barcodeHint")}
        </p>
      </div>

      <div className="rounded-lg border border-[#333] bg-[#151515] px-4 py-3" data-help-id="material-instances-form-barcode-toggle">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-200">{t("materialInstances.form.barcodeAsSerialLabel")}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("materialInstances.form.barcodeAsSerialHint")}
            </p>
          </div>
          <input
            type="checkbox"
            checked={useBarcodeAsSerial}
            onChange={(e) => handleBarcodeAsSerialToggle(e.target.checked)}
            className="h-4 w-4 rounded border-[#444] bg-[#1a1a1a] text-[#FFD700] focus:ring-[#FFD700]"
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{t("materialInstances.form.locationLabel")} *</label>
        <select
          data-help-id="material-instances-form-location"
          value={formData.locationId}
          onChange={(e) => handleChange("locationId", e.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, locationId: true }))}
          className={`w-full px-4 py-3 bg-[#1a1a1a] border ${
            touched.locationId && errors.locationId ? "border-red-500" : "border-[#333]"
          } rounded-lg text-white focus:outline-none focus:border-[#FFD700]`}
          required
        >
          <option value="">{t("materialInstances.form.selectLocation")}</option>
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>
              {loc.name} — {formatLocationAddress(loc)}
            </option>
          ))}
        </select>
        {touched.locationId && errors.locationId && (
          <p className="text-xs text-red-500 mt-1">{errors.locationId}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" loading={isSubmitting} className="flex-1" data-help-id="material-instances-form-submit">
          {isSubmitting
            ? isEditing
              ? t("materialInstances.form.submittingUpdate")
              : t("materialInstances.form.submittingCreate")
            : isEditing
              ? t("materialInstances.form.submitUpdate")
              : t("materialInstances.form.submitCreate")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          data-help-id="material-instances-form-cancel"
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
};
