/**
 * CustomerAddressFields — Reusable address form section for create/edit modals.
 * Uses SearchableSelect for department and city dropdowns.
 */

import { SearchableSelect, type SelectOption } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import {
  COLOMBIA_STREET_TYPES,
  formatAddressSegmentInput,
  formatAddressDetailsInput,
  type ColombiaDepartment,
  type ColombiaCity,
} from "./useCustomerForm";

interface CustomerAddressFieldsProps {
  streetType: string;
  onStreetTypeChange: (value: string) => void;
  mainNumber: string;
  onMainNumberChange: (value: string) => void;
  secondaryNumber: string;
  onSecondaryNumberChange: (value: string) => void;
  complementaryNumber: string;
  onComplementaryNumberChange: (value: string) => void;
  additionalDetails: string;
  onAdditionalDetailsChange: (value: string) => void;
  postalCodeField: string;
  onPostalCodeChange: (value: string) => void;
  filteredDepartments: ColombiaDepartment[];
  filteredCities: ColombiaCity[];
  selectedState: ColombiaDepartment | null;
  selectedCity: ColombiaCity | null;
  canEditPostalCode: boolean;
  onSelectDepartment: (dept: ColombiaDepartment) => void;
  onSelectCity: (city: ColombiaCity) => void;
  fieldErrors: Record<string, string>;
  onBlurField: (field: string) => void;
  onMarkTouched: (field: string) => void;
  formattedStreet: string;
  disabled: boolean;
}

const ADDRESS_SEGMENT_MAX = 8;

const inputClass = (hasError: boolean) =>
  `w-full bg-zinc-900 rounded-xl py-3 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${
    hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"
  }`;

export function CustomerAddressFields({
  streetType,
  onStreetTypeChange,
  mainNumber,
  onMainNumberChange,
  secondaryNumber,
  onSecondaryNumberChange,
  complementaryNumber,
  onComplementaryNumberChange,
  additionalDetails,
  onAdditionalDetailsChange,
  postalCodeField,
  onPostalCodeChange,
  filteredDepartments,
  filteredCities,
  selectedState,
  selectedCity,
  canEditPostalCode,
  onSelectDepartment,
  onSelectCity,
  fieldErrors,
  onBlurField,
  onMarkTouched,
  formattedStreet,
  disabled,
}: CustomerAddressFieldsProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  // ── SearchableSelect options ─────────────────────────────────────────────
  const streetTypeOptions: SelectOption[] = COLOMBIA_STREET_TYPES.map((st) => ({
    value: st,
    label: st,
  }));

  const departmentOptions: SelectOption[] = filteredDepartments.map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  const cityOptions: SelectOption[] = filteredCities.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  // Department SearchableSelect value (the id as string, or "" if none)
  const selectedDeptValue = selectedState ? String(selectedState.id) : "";
  const selectedCityValue = selectedCity ? String(selectedCity.id) : "";

  const handleDepartmentSelect = (idStr: string) => {
    const dept = filteredDepartments.find((d) => String(d.id) === idStr);
    if (dept) onSelectDepartment(dept);
  };

  const handleCitySelect = (idStr: string) => {
    const city = filteredCities.find((c) => String(c.id) === idStr);
    if (city) onSelectCity(city);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Street Type */}
      <div className="form-group md:col-span-2">
        <SearchableSelect
          label={isEs ? "Tipo de vía *" : "Street Type *"}
          options={streetTypeOptions}
          value={streetType}
          onChange={(v) => {
            onMarkTouched("streetType");
            onStreetTypeChange(v);
          }}
          placeholder={isEs ? "Seleccionar tipo de vía" : "Select street type"}
          error={fieldErrors.streetType}
          disabled={disabled}
        />
      </div>

      {/* Primary Number */}
      <div className="form-group">
        <label className="form-label">{isEs ? "Número principal *" : "Primary Number *"}</label>
        <input
          type="text"
          inputMode="text"
          maxLength={ADDRESS_SEGMENT_MAX}
          placeholder="8ª E"
          value={mainNumber}
          onChange={(e) => {
            onMarkTouched("mainNumber");
            onMainNumberChange(formatAddressSegmentInput(e.target.value));
          }}
          onBlur={() => onBlurField("mainNumber")}
          className={inputClass(!!fieldErrors.mainNumber)}
          disabled={disabled}
        />
        {fieldErrors.mainNumber && (
          <p className="text-red-400 text-xs mt-1">{fieldErrors.mainNumber}</p>
        )}
      </div>

      {/* Secondary Number */}
      <div className="form-group">
        <label className="form-label">{isEs ? "Número secundario *" : "Secondary Number *"}</label>
        <input
          type="text"
          inputMode="text"
          maxLength={ADDRESS_SEGMENT_MAX}
          placeholder="93B"
          value={secondaryNumber}
          onChange={(e) => {
            onMarkTouched("secondaryNumber");
            onSecondaryNumberChange(formatAddressSegmentInput(e.target.value));
          }}
          onBlur={() => onBlurField("secondaryNumber")}
          className={inputClass(!!fieldErrors.secondaryNumber)}
          disabled={disabled}
        />
        {fieldErrors.secondaryNumber && (
          <p className="text-red-400 text-xs mt-1">{fieldErrors.secondaryNumber}</p>
        )}
      </div>

      {/* Complementary Number */}
      <div className="form-group">
        <label className="form-label">
          {isEs ? "Número complementario *" : "Complementary Number *"}
        </label>
        <input
          type="text"
          inputMode="text"
          maxLength={ADDRESS_SEGMENT_MAX}
          placeholder="47A"
          value={complementaryNumber}
          onChange={(e) => {
            onMarkTouched("complementaryNumber");
            onComplementaryNumberChange(formatAddressSegmentInput(e.target.value));
          }}
          onBlur={() => onBlurField("complementaryNumber")}
          className={inputClass(!!fieldErrors.complementaryNumber)}
          disabled={disabled}
        />
        {fieldErrors.complementaryNumber && (
          <p className="text-red-400 text-xs mt-1">{fieldErrors.complementaryNumber}</p>
        )}
      </div>

      {/* Department */}
      <div className="form-group">
        <SearchableSelect
          label={isEs ? "Departamento *" : "Department *"}
          options={departmentOptions}
          value={selectedDeptValue}
          onChange={handleDepartmentSelect}
          placeholder={isEs ? "Buscar departamento..." : "Search department..."}
          error={fieldErrors.stateQuery}
          disabled={disabled}
        />
      </div>

      {/* City */}
      <div className="form-group">
        <SearchableSelect
          label={isEs ? "Ciudad *" : "City *"}
          options={cityOptions}
          value={selectedCityValue}
          onChange={handleCitySelect}
          placeholder={
            selectedState
              ? isEs ? "Buscar ciudad..." : "Search city..."
              : isEs ? "Seleccione un departamento primero" : "Select a department first"
          }
          error={fieldErrors.cityQuery}
          disabled={disabled || !selectedState}
        />
      </div>

      {/* Additional Details */}
      <div className="form-group md:col-span-2">
        <label className="form-label">
          {isEs ? "Detalles adicionales" : "Additional Details"}{" "}
          <span className="text-gray-600">({isEs ? "Opcional" : "Optional"})</span>
        </label>
        <input
          type="text"
          placeholder="Centro Empresarial, Oficina 602"
          value={additionalDetails}
          onChange={(e) => {
            onMarkTouched("additionalDetails");
            onAdditionalDetailsChange(formatAddressDetailsInput(e.target.value));
          }}
          onBlur={() => onBlurField("additionalDetails")}
          className={inputClass(!!fieldErrors.additionalDetails)}
          disabled={disabled}
        />
        {fieldErrors.additionalDetails && (
          <p className="text-red-400 text-xs mt-1">{fieldErrors.additionalDetails}</p>
        )}
      </div>

      {/* Postal Code */}
      <div className="form-group">
        <label className="form-label">{isEs ? "Código postal" : "Postal Code"}</label>
        <input
          type="text"
          placeholder={
            selectedCity
              ? canEditPostalCode
                ? isEs ? "Ingrese código postal" : "Enter postal code"
                : isEs ? "Auto-completado" : "Auto-filled from city"
              : isEs ? "Seleccione una ciudad" : "Select a city first"
          }
          value={postalCodeField}
          readOnly={!canEditPostalCode}
          disabled={disabled || !selectedCity}
          onChange={(e) => onPostalCodeChange(e.target.value)}
          onBlur={() => {
            if (canEditPostalCode) onBlurField("postalCode");
          }}
          className={inputClass(!!fieldErrors.postalCode)}
        />
        {fieldErrors.postalCode && (
          <p className="text-red-400 text-xs mt-1">{fieldErrors.postalCode}</p>
        )}
      </div>

      {/* Address Preview */}
      <div className="form-group">
        <label className="form-label">{isEs ? "Vista previa" : "Address Preview"}</label>
        <input
          type="text"
          value={formattedStreet}
          readOnly
          placeholder="Carrera 15 # 93-47"
          className={inputClass(false)}
          disabled
        />
      </div>
    </div>
  );
}
