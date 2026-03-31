/**
 * CustomerCreateModal — FormModal for creating a new customer.
 */

import { SearchableSelect, type SelectOption } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import type {
  CreateCustomerPayload,
  DocumentType,
  DocumentTypeInfo,
} from "../../../../types/api";
import { CustomerAddressFields } from "./CustomerAddressFields";
import {
  useCustomerForm,
  COLOMBIA_PHONE_PREFIX,
  formatNameInput,
  formatPhoneInput,
  formatEmailInput,
} from "./useCustomerForm";
import { FormModal } from "../../../../components/ui";

interface CustomerCreateModalProps {
  open: boolean;
  onClose: () => void;
  documentTypes: DocumentTypeInfo[];
  onSubmit: (payload: CreateCustomerPayload) => Promise<void>;
  loading: boolean;
}

const inputClass = (hasError: boolean) =>
  `w-full bg-zinc-900 rounded-xl py-3 px-4 text-white outline-none transition duration-200 disabled:opacity-50 border ${
    hasError ? "border-red-500 focus:border-red-500" : "border-zinc-800 focus:border-yellow-400"
  }`;

const phoneWrapperClass = (hasError: boolean) =>
  `w-full bg-zinc-900 rounded-xl text-white transition duration-200 border ${
    hasError ? "border-red-500 focus-within:border-red-500" : "border-zinc-800 focus-within:border-yellow-400"
  }`;

export function CustomerCreateModal({
  open,
  onClose,
  documentTypes,
  onSubmit,
  loading,
}: CustomerCreateModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const form = useCustomerForm();

  const docTypeOptions: SelectOption[] = documentTypes.map((dt) => ({
    value: dt.value,
    label: dt.displayName,
  }));

  const handleClose = () => {
    form.resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    form.setSubmitted(true);
    const allErrors = form.runValidation({ allTouched: true });
    if (Object.keys(allErrors).length > 0) return;

    const payload: CreateCustomerPayload = {
      ...form.formData,
      phone: `${COLOMBIA_PHONE_PREFIX}${form.formData.phone}`,
      address: form.buildAddressPayload(),
    };
    await onSubmit(payload);
    form.resetForm();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={isEs ? "Crear Nuevo Cliente" : "Create New Customer"}
      onSubmit={() => void handleSubmit()}
      loading={loading}
      submitLabel={isEs ? "Crear Cliente" : "Create Customer"}
      cancelLabel={isEs ? "Cancelar" : "Cancel"}
      size="lg"
    >
      {/* Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">{isEs ? "Primer nombre *" : "First Name *"}</label>
          <input
            type="text"
            value={form.formData.name.firstName}
            onChange={(e) => {
              form.markTouched("firstName");
              form.setFormData({
                ...form.formData,
                name: { ...form.formData.name, firstName: formatNameInput(e.target.value) },
              });
            }}
            onBlur={() => form.blurField("firstName")}
            className={inputClass(!!form.fieldErrors.firstName)}
            disabled={loading}
          />
          {form.fieldErrors.firstName && (
            <p className="text-red-400 text-xs mt-1">{form.fieldErrors.firstName}</p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">{isEs ? "Segundo nombre" : "Middle Name"}</label>
          <input
            type="text"
            value={form.formData.name.secondName || ""}
            onChange={(e) =>
              form.setFormData({
                ...form.formData,
                name: { ...form.formData.name, secondName: formatNameInput(e.target.value) },
              })
            }
            className={inputClass(false)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">{isEs ? "Primer apellido *" : "Last Name *"}</label>
          <input
            type="text"
            value={form.formData.name.firstSurname}
            onChange={(e) => {
              form.markTouched("firstSurname");
              form.setFormData({
                ...form.formData,
                name: { ...form.formData.name, firstSurname: formatNameInput(e.target.value) },
              });
            }}
            onBlur={() => form.blurField("firstSurname")}
            className={inputClass(!!form.fieldErrors.firstSurname)}
            disabled={loading}
          />
          {form.fieldErrors.firstSurname && (
            <p className="text-red-400 text-xs mt-1">{form.fieldErrors.firstSurname}</p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">{isEs ? "Segundo apellido" : "Second Last Name"}</label>
          <input
            type="text"
            value={form.formData.name.secondSurname || ""}
            onChange={(e) =>
              form.setFormData({
                ...form.formData,
                name: { ...form.formData.name, secondSurname: formatNameInput(e.target.value) },
              })
            }
            className={inputClass(false)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">{isEs ? "Correo electrónico *" : "Email *"}</label>
          <input
            type="email"
            value={form.formData.email}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => {
              form.markTouched("email");
              form.setFormData({ ...form.formData, email: formatEmailInput(e.target.value) });
            }}
            onBlur={() => form.blurField("email")}
            className={inputClass(!!form.fieldErrors.email)}
            disabled={loading}
          />
          {form.fieldErrors.email && (
            <p className="text-red-400 text-xs mt-1">{form.fieldErrors.email}</p>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">{isEs ? "Teléfono *" : "Phone *"}</label>
          <div className={phoneWrapperClass(!!form.fieldErrors.phone)}>
            <div className="flex items-center">
              <span className="text-white pl-4 pr-2 select-none whitespace-pre">
                {COLOMBIA_PHONE_PREFIX}{" "}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="3001234567"
                value={form.formData.phone}
                onChange={(e) => {
                  form.markTouched("phone");
                  form.setFormData({ ...form.formData, phone: formatPhoneInput(e.target.value) });
                }}
                onBlur={() => form.blurField("phone")}
                className="w-full bg-transparent py-3 pr-4 text-white outline-none"
                disabled={loading}
              />
            </div>
          </div>
          {form.fieldErrors.phone && (
            <p className="text-red-400 text-xs mt-1">{form.fieldErrors.phone}</p>
          )}
        </div>
      </div>

      {/* Document */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <SearchableSelect
            label={isEs ? "Tipo de documento *" : "Document Type *"}
            options={docTypeOptions}
            value={form.formData.documentType}
            onChange={(v) =>
              form.setFormData({ ...form.formData, documentType: v as DocumentType })
            }
            placeholder={isEs ? "Seleccionar tipo" : "Select type"}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{isEs ? "Número de documento *" : "Document Number *"}</label>
          <input
            type="text"
            minLength={8}
            maxLength={11}
            value={form.formData.documentNumber}
            onChange={(e) => {
              form.markTouched("documentNumber");
              form.setFormData({ ...form.formData, documentNumber: e.target.value });
            }}
            onBlur={() => form.blurField("documentNumber")}
            className={inputClass(!!form.fieldErrors.documentNumber)}
            disabled={loading}
          />
          {form.fieldErrors.documentNumber && (
            <p className="text-red-400 text-xs mt-1">{form.fieldErrors.documentNumber}</p>
          )}
        </div>
      </div>

      {/* Address toggle */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          {isEs ? "Dirección" : "Address"}
        </h3>
        <button
          type="button"
          onClick={() => form.setShowAddress((v) => !v)}
          className="text-xs text-yellow-400 hover:text-yellow-300 transition border border-yellow-400/30 hover:border-yellow-400/60 rounded-lg px-3 py-1"
          disabled={loading}
        >
          {form.showAddress ? (isEs ? "Ocultar" : "Hide") : (isEs ? "Agregar dirección" : "Add Address")}
        </button>
      </div>

      {form.showAddress && (
        <CustomerAddressFields
          streetType={form.streetType}
          onStreetTypeChange={form.setStreetType}
          mainNumber={form.mainNumber}
          onMainNumberChange={form.setMainNumber}
          secondaryNumber={form.secondaryNumber}
          onSecondaryNumberChange={form.setSecondaryNumber}
          complementaryNumber={form.complementaryNumber}
          onComplementaryNumberChange={form.setComplementaryNumber}
          additionalDetails={form.additionalDetails}
          onAdditionalDetailsChange={form.setAdditionalDetails}
          postalCodeField={form.postalCodeField}
          onPostalCodeChange={form.handlePostalCodeChange}
          filteredDepartments={form.filteredDepartments}
          filteredCities={form.filteredCities}
          selectedState={form.selectedState}
          selectedCity={form.selectedCity}
          canEditPostalCode={form.canEditPostalCode}
          onSelectDepartment={form.selectDepartment}
          onSelectCity={form.selectCity}
          fieldErrors={form.fieldErrors}
          onBlurField={form.blurField}
          onMarkTouched={form.markTouched}
          formattedStreet={form.formattedStreet}
          disabled={loading}
        />
      )}
    </FormModal>
  );
}
