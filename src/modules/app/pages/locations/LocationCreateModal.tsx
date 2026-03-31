/**
 * LocationCreateModal — Form for creating a new warehouse location
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Modal, SearchableSelect, type SelectOption } from "../../../../components/ui";
import type { MaterialType, MaterialCategory } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useToast } from "../../../../contexts/ToastContext";
import { useAuth } from "../../../../contexts/useAuth";
import { validateLocationV2 } from "../../../../utils/validators";
import { createLocation as apiCreateLocation } from "../../../../services/warehouseOperatorService";
import { useColombiaAddress } from "./useColombiaAddress";
import { resolveCategoryName, buildCapacitiesFromTypes, applyBulkCapacityToRows } from "./helpers";
import { INITIAL_FORM, STREET_TYPES, STATUS_OPTIONS } from "./types";
import type { LocationFormData, LocationFieldErrors } from "./types";

interface LocationCreateModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Callback after successful creation */
  onCreated: () => void;
  /** All material types */
  materialTypes: MaterialType[];
  /** All categories */
  categories: MaterialCategory[];
}

const ITEMS_PER_PAGE = 5;

export function LocationCreateModal({
  open,
  onClose,
  onCreated,
  materialTypes,
  categories,
}: LocationCreateModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { showToast } = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState<LocationFormData>({
    ...INITIAL_FORM,
    materialCapacities: buildCapacitiesFromTypes(materialTypes),
  });
  const [fieldErrors, setFieldErrors] = useState<LocationFieldErrors>({});
  const [materialPage, setMaterialPage] = useState(1);
  const [bulkQtyInput, setBulkQtyInput] = useState("");
  const [bulkCategoryFilter, setBulkCategoryFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const colombia = useColombiaAddress();

  // Reset form when modal opens
  const handleOpen = () => {
    setForm({
      ...INITIAL_FORM,
      materialCapacities: buildCapacitiesFromTypes(materialTypes),
    });
    setFieldErrors({});
    setMaterialPage(1);
    setBulkQtyInput("");
    setBulkCategoryFilter("");
    colombia.reset();
  };

  // Reset when open changes
  if (open && form.name === "" && form.materialCapacities.length === 0 && materialTypes.length > 0) {
    handleOpen();
  }

  const totalMaterialPages = Math.ceil(materialTypes.length / ITEMS_PER_PAGE);
  const paginatedMaterials = useMemo(() => {
    const start = (materialPage - 1) * ITEMS_PER_PAGE;
    return materialTypes.slice(start, start + ITEMS_PER_PAGE);
  }, [materialTypes, materialPage]);

  const statusOptions: SelectOption[] = STATUS_OPTIONS.map((s) => ({
    value: s.value,
    label: isEs ? s.labelEs : s.labelEn,
  }));

  const streetTypeOptions: SelectOption[] = [
    { value: "", label: isEs ? "Seleccionar tipo" : "Select type" },
    ...STREET_TYPES.map((st) => ({ value: st, label: st })),
  ];

  const departmentOptions: SelectOption[] = colombia.filteredDepartments.map((d) => ({
    value: d.id.toString(),
    label: d.name,
  }));

  const cityOptions: SelectOption[] = colombia.filteredCities.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  const categoryFilterOptions: SelectOption[] = [
    { value: "", label: isEs ? "Todas las categorías" : "All Categories" },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const updateForm = <K extends keyof Pick<LocationFormData, "name" | "status">>(
    k: K,
    v: LocationFormData[K],
  ) => setForm((s) => ({ ...s, [k]: v }));

  const updateAddress = (k: keyof LocationFormData["address"], v: string) =>
    setForm((s) => ({ ...s, address: { ...s.address, [k]: v } }));

  const updateCapacity = (id: string, val: string | number) => {
    setForm((s) => ({
      ...s,
      materialCapacities: s.materialCapacities.map((c) =>
        c.materialTypeId === id ? { ...c, maxQuantity: val === "" ? "" : Number(val) } : c,
      ),
    }));
    if (val !== "") {
      setFieldErrors((s) => ({ ...s, [`capacity_${id}`]: undefined }));
    }
  };

  const handleBulkApply = () => {
    const qty = Number(bulkQtyInput);
    if (!bulkQtyInput.trim() || isNaN(qty) || qty < 0) {
      showToast("warning", isEs ? "Ingresa un número válido" : "Enter a valid number");
      return;
    }
    setForm((s) => ({
      ...s,
      materialCapacities: applyBulkCapacityToRows(
        s.materialCapacities,
        qty,
        materialTypes,
        bulkCategoryFilter || undefined,
      ),
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith("capacity_")) delete next[k];
      });
      return next;
    });
    showToast("success", isEs ? "Capacidad en bloque aplicada" : "Bulk capacity applied");
  };

  const handleSubmit = async () => {
    const validation = validateLocationV2({
      name: form.name,
      address: {
        streetType: form.address.streetType,
        primaryNumber: form.address.primaryNumber,
        secondaryNumber: form.address.secondaryNumber,
        complementaryNumber: form.address.complementaryNumber,
        department: form.address.state,
        city: form.address.city,
        additionalDetails: form.address.additionalInfo,
      },
      materialCapacities: form.materialCapacities,
    });

    if (!validation.isValid || !form.address.state.trim()) {
      const capErrors: Record<string, string> = {};
      form.materialCapacities.forEach((c) => {
        if (c.maxQuantity === "") capErrors[`capacity_${c.materialTypeId}`] = "Required";
      });
      const stateError = !form.address.state.trim()
        ? { "address.state": isEs ? "El departamento es obligatorio" : "Department is required" }
        : {};
      setFieldErrors({ ...validation.errors, ...capErrors, ...stateError });
      showToast("warning", isEs ? "Completa todos los campos requeridos" : "Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateLocation({
        name: form.name,
        organizationId: user?.organizationId ?? "",
        status: form.status,
        address: {
          streetType: form.address.streetType,
          primaryNumber: form.address.primaryNumber,
          secondaryNumber: form.address.secondaryNumber,
          complementaryNumber: form.address.complementaryNumber,
          department: form.address.state,
          city: form.address.city,
          additionalDetails: form.address.additionalInfo || undefined,
        },
        materialCapacities: form.materialCapacities.map((c) => ({
          materialTypeId: c.materialTypeId,
          maxQuantity: Number(c.maxQuantity),
        })),
      });
      showToast("success", isEs ? "Ubicación creada" : "Location created");
      onCreated();
      onClose();
    } catch (err) {
      const error = err as Error;
      showToast("error", error.message ?? (isEs ? "Error al crear ubicación" : "Error creating location"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEs ? "Crear ubicación" : "Create Location"} size="xl">
      <p className="text-gray-400 text-sm mb-6">
        {isEs
          ? "Agrega una nueva ubicación de almacén con capacidades de material específicas"
          : "Add a new warehouse location with specific material capacities"}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: General info + Address */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white border-l-4 border-[#FFD700] pl-3">
              {isEs ? "Información general" : "General Information"}
            </h3>

            {/* Name */}
            <div>
              <label className="form-label">
                {isEs ? "Nombre de ubicación" : "Location Name"} <span className="text-red-400">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => {
                  updateForm("name", e.target.value);
                  setFieldErrors((s) => ({ ...s, name: e.target.value.trim() ? undefined : (isEs ? "El nombre es obligatorio" : "Name is required") }));
                }}
                placeholder={isEs ? "Ej. Almacén principal A" : "e.g. Main Warehouse A"}
                className={`form-input ${fieldErrors.name ? "border-red-500" : ""}`}
              />
              {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="form-label">
                {isEs ? "Estado" : "Status"} <span className="text-red-400">*</span>
              </label>
              <SearchableSelect
                options={statusOptions}
                value={form.status}
                onChange={(v) => updateForm("status", v as LocationFormData["status"])}
                placeholder={isEs ? "Estado" : "Status"}
              />
            </div>

            {/* Country */}
            <div>
              <label className="form-label">{isEs ? "País" : "Country"}</label>
              <input value="Colombia" disabled className="form-input opacity-50 cursor-not-allowed" />
            </div>

            {/* Department + City */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="form-label">
                  {isEs ? "Departamento" : "Department"} <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={departmentOptions}
                  value={colombia.selectedDepartment}
                  onChange={(v) => {
                    const dept = colombia.departments.find((d) => d.id.toString() === v);
                    if (dept) {
                      colombia.setSelectedDepartment(v);
                      colombia.setDepartmentQuery(dept.name);
                      updateAddress("state", dept.name);
                      colombia.setCityQuery("");
                      updateAddress("city", "");
                      setFieldErrors((s) => ({ ...s, "address.state": undefined }));
                    }
                  }}
                  placeholder={isEs ? "Buscar departamento..." : "Search department..."}
                  disabled={colombia.loadingDepartments}
                  error={fieldErrors["address.state"]}
                />
              </div>

              <div>
                <label className="form-label">
                  {isEs ? "Ciudad" : "City"} <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={cityOptions}
                  value={form.address.city}
                  onChange={(v) => {
                    updateAddress("city", v);
                    colombia.setCityQuery(v);
                    setFieldErrors((s) => ({ ...s, "address.city": undefined }));
                  }}
                  placeholder={
                    colombia.selectedDepartment
                      ? isEs ? "Buscar ciudad..." : "Search city..."
                      : isEs ? "Selecciona depto. primero" : "Select dept first"
                  }
                  disabled={!colombia.selectedDepartment || colombia.loadingCities}
                  error={fieldErrors["address.city"]}
                />
              </div>
            </div>

            {/* Street fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label">
                  {isEs ? "Tipo de calle" : "Street Type"} <span className="text-red-400">*</span>
                </label>
                <SearchableSelect
                  options={streetTypeOptions}
                  value={form.address.streetType}
                  onChange={(v) => {
                    updateAddress("streetType", v);
                    setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                  }}
                  error={fieldErrors["address.street"]}
                />
              </div>
              <div>
                <label className="form-label">
                  {isEs ? "Número" : "Number"} <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.address.primaryNumber}
                  onChange={(e) => {
                    updateAddress("primaryNumber", e.target.value);
                    setFieldErrors((s) => ({ ...s, "address.street": undefined }));
                  }}
                  placeholder="e.g. 10"
                  className={`form-input ${fieldErrors["address.street"] ? "border-red-500" : ""}`}
                />
              </div>
              <div>
                <label className="form-label">
                  {isEs ? "Propiedad #" : "Property #"} <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.address.secondaryNumber}
                  onChange={(e) => {
                    updateAddress("secondaryNumber", e.target.value);
                    setFieldErrors((s) => ({ ...s, "address.propertyNumber": undefined }));
                  }}
                  placeholder="e.g. 45"
                  className={`form-input ${fieldErrors["address.propertyNumber"] ? "border-red-500" : ""}`}
                />
                {fieldErrors["address.propertyNumber"] && (
                  <p className="form-error">{fieldErrors["address.propertyNumber"]}</p>
                )}
              </div>
              <div>
                <label className="form-label">
                  Comp. <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.address.complementaryNumber}
                  onChange={(e) => {
                    updateAddress("complementaryNumber", e.target.value);
                    setFieldErrors((s) => ({ ...s, "address.complementaryNumber": undefined }));
                  }}
                  placeholder="e.g. 67"
                  className={`form-input ${fieldErrors["address.complementaryNumber"] ? "border-red-500" : ""}`}
                />
                {fieldErrors["address.complementaryNumber"] && (
                  <p className="form-error">{fieldErrors["address.complementaryNumber"]}</p>
                )}
              </div>
            </div>
            {fieldErrors["address.street"] && (
              <p className="form-error -mt-4">{fieldErrors["address.street"]}</p>
            )}

            {/* Additional Details */}
            <div>
              <label className="form-label">{isEs ? "Detalles adicionales" : "Additional Details"}</label>
              <textarea
                value={form.address.additionalInfo}
                onChange={(e) => updateAddress("additionalInfo", e.target.value)}
                placeholder={isEs ? "Ej. Cerca de la entrada principal" : "e.g. Near the main entrance"}
                rows={2}
                className="form-input resize-none"
              />
            </div>
          </div>

          {/* Right column: Material Capacities */}
          <div className="space-y-6 flex flex-col">
            <div className="flex items-center justify-between border-l-4 border-[#FFD700] pl-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {isEs ? "Capacidades de material" : "Material Capacities"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.materialCapacities.filter((c) => c.maxQuantity !== "").length}{" "}
                  {isEs ? "de" : "of"} {form.materialCapacities.length}{" "}
                  {isEs ? "configuradas" : "configured"}
                </p>
              </div>
              <span className="text-xs text-gray-500">
                {isEs ? `Pág. ${materialPage} de ${totalMaterialPages}` : `Page ${materialPage} of ${totalMaterialPages}`}
              </span>
            </div>

            {/* Bulk tool */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#FFD700] mb-4 pb-3 border-b border-[#2a2a2a]">
                <Zap size={18} className="animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {isEs ? "Configuración masiva" : "Bulk Capacity Setting"}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    {isEs ? "Categoría (opcional)" : "Category (optional)"}
                  </label>
                  <SearchableSelect
                    options={categoryFilterOptions}
                    value={bulkCategoryFilter}
                    onChange={setBulkCategoryFilter}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    {isEs ? "Cantidad *" : "Quantity *"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bulkQtyInput}
                    onChange={(e) => setBulkQtyInput(e.target.value)}
                    placeholder={isEs ? "Ingresar cantidad" : "Enter quantity"}
                    className="form-input"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBulkApply}
                  className="h-10 px-6 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-semibold rounded text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  {isEs ? "Aplicar" : "Apply"}
                </button>
              </div>
            </div>

            {/* Material list */}
            <div className="flex-1 space-y-3 min-h-[300px]">
              {paginatedMaterials.map((type) => {
                const capacity = form.materialCapacities.find((c) => c.materialTypeId === type._id);
                const hasError = !!fieldErrors[`capacity_${type._id}`];
                const isEdited = capacity?.maxQuantity !== "";
                const categoryName = resolveCategoryName(type.categoryId, categories);

                return (
                  <div
                    key={type._id}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                      hasError
                        ? "bg-red-950/20 border-red-500/40"
                        : isEdited
                          ? "bg-[#111] border-[#333]"
                          : "bg-[#1a1111]/30 border-red-900/30"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{type.name}</p>
                      <p className="text-xs text-gray-500">{categoryName}</p>
                    </div>
                    <div className="w-28 shrink-0">
                      <input
                        type="number"
                        min={0}
                        value={capacity?.maxQuantity ?? ""}
                        onChange={(e) => updateCapacity(type._id, e.target.value)}
                        placeholder={isEs ? "cant." : "qty"}
                        className={`w-full h-9 px-2 bg-[#0a0a0a] border rounded text-right text-sm text-white focus:outline-none focus:ring-1 ${
                          hasError
                            ? "border-red-500 focus:ring-red-500"
                            : isEdited
                              ? "border-[#333] focus:ring-[#FFD700]"
                              : "border-red-900/50 focus:ring-red-500"
                        }`}
                      />
                      {hasError && (
                        <p className="text-[10px] text-red-400 mt-0.5 text-right">
                          {fieldErrors[`capacity_${type._id}`]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Material pagination */}
            <div className="flex items-center justify-between pt-2 border-t border-[#222]">
              <button
                type="button"
                disabled={materialPage === 1}
                onClick={() => setMaterialPage((p) => Math.max(1, p - 1))}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalMaterialPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMaterialPage(p)}
                    className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                      materialPage === p ? "bg-[#FFD700] text-black" : "text-gray-500 hover:bg-[#222]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={materialPage === totalMaterialPages}
                onClick={() => setMaterialPage((p) => Math.min(totalMaterialPages, p + 1))}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
          >
            {isEs ? "Cancelar" : "Cancel"}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-[#FFD700] text-black font-bold rounded-lg hover:bg-[#FFC700] transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50"
          >
            {submitting
              ? isEs ? "Creando..." : "Creating..."
              : isEs ? "Crear ubicación" : "Create Location"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
