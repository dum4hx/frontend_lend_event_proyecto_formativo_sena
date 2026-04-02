import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button, IconButton, MaterialSelector } from "../../../../components/ui";
import type {
  Customer,
  LoanRequestItem,
  MaterialCategory,
  MaterialInstance,
  MaterialType,
  Package,
  CreateLoanRequestPayload,
} from "../../../../types/api";
import { useAlertModal } from "../../../../hooks/useAlertModal";
import { useCurrencyInput } from "../../../../hooks/useCurrencyInput";
import { useLanguage } from "../../../../contexts/useLanguage";
import {
  applySelectedMaterialToDraftRows,
  calculateRentalDays,
  isFormDraftItemEmpty,
  mergeSelectionsIntoDraftRows,
  type DraftMaterialSelection,
  type FormDraftItem,
} from "../ordersDraft.helpers";
import type {
  CreateOrderValidationErrors,
  DraftItemValidationErrors,
  MaterialAvailability,
} from "./types";
import {
  EMPTY_FORM,
  RECENT_ORDER_MATERIALS_KEY,
  ORDER_MATERIAL_USAGE_KEY,
  LOW_STOCK_THRESHOLD,
} from "./types";
import {
  formatMoney,
  normalizeSearchText,
  getMaterialSearchScore,
  extractCategoryId,
  extractMaterialTypeIdFromInstance,
  extractMaterialTypeIdFromPackageEntry,
  getTodayLocalDatetimeString,
  toSafeStartDateIso,
  toSafeEndDateIso,
} from "./helpers";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  materialCategories: MaterialCategory[];
  materialInstances: MaterialInstance[];
  materialTypes: MaterialType[];
  packages: Package[];
  inventoryDataAvailable: boolean;
  onSubmit: (payload: CreateLoanRequestPayload) => Promise<void>;
  submitting: boolean;
}

export function CreateOrderModal({
  open,
  onClose,
  customers,
  materialCategories,
  materialInstances,
  materialTypes,
  packages,
  inventoryDataAvailable,
  onSubmit,
  submitting,
}: CreateOrderModalProps) {
  const { showError, showSuccess, AlertModal } = useAlertModal();
  const { language } = useLanguage();
  const isEs = language === "es";

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // ── Currency input hook for depositAmount ─────────────────────────────
  const depositAmountInput = useCurrencyInput(
    formData.depositAmount ? Number(formData.depositAmount) : "",
    (val) => setFormData((prev) => ({ ...prev, depositAmount: val || undefined })),
  );

  const [formItems, setFormItems] = useState<FormDraftItem[]>([
    {
      localId: crypto.randomUUID(),
      categoryId: "",
      materialTypeId: "",
      materialSearchTerm: "",
      quantity: "1",
    },
  ]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [recentMaterialIds, setRecentMaterialIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_ORDER_MATERIALS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((entry): entry is string => typeof entry === "string");
      }
    } catch {
      /* ignore */
    }
    return [];
  });
  const [materialUsageCounts, setMaterialUsageCounts] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(ORDER_MATERIAL_USAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const next: Record<string, number> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === "number" && Number.isFinite(value) && value > 0) {
            next[key] = value;
          }
        }
        return next;
      }
    } catch {
      /* ignore */
    }
    return {};
  });
  const [activeMaterialRowId, setActiveMaterialRowId] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(RECENT_ORDER_MATERIALS_KEY, JSON.stringify(recentMaterialIds));
    } catch {
      /* ignore */
    }
  }, [recentMaterialIds]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDER_MATERIAL_USAGE_KEY, JSON.stringify(materialUsageCounts));
    } catch {
      /* ignore */
    }
  }, [materialUsageCounts]);

  const materialAvailabilityByType = useMemo(() => {
    const availability = new Map<string, MaterialAvailability>();
    for (const instance of materialInstances) {
      const materialTypeId = extractMaterialTypeIdFromInstance(instance);
      if (!materialTypeId) continue;
      const current = availability.get(materialTypeId) ?? {
        total: 0,
        available: 0,
      };
      current.total += 1;
      if (instance.status === "available") {
        current.available += 1;
      }
      availability.set(materialTypeId, current);
    }
    return availability;
  }, [materialInstances]);

  const isMaterialSelectable = useCallback(
    (materialId: string): boolean => {
      if (!inventoryDataAvailable) return true;
      return (materialAvailabilityByType.get(materialId)?.available ?? 0) > 0;
    },
    [inventoryDataAvailable, materialAvailabilityByType],
  );

  const getMaterialAvailabilityLabel = useCallback(
    (materialId: string): { text: string; tone: "neutral" | "success" | "warning" | "danger" } => {
      if (!inventoryDataAvailable) {
        return { text: "Stock unknown", tone: "neutral" };
      }
      const availability = materialAvailabilityByType.get(materialId);
      const available = availability?.available ?? 0;
      const total = availability?.total ?? 0;

      if (available <= 0) return { text: "Out of stock", tone: "danger" };
      if (available <= LOW_STOCK_THRESHOLD)
        return {
          text: `Low stock (${available}/${total})`,
          tone: "warning",
        };
      return { text: `Available (${available}/${total})`, tone: "success" };
    },
    [inventoryDataAvailable, materialAvailabilityByType],
  );

  const getAvailabilityBadgeClass = useCallback(
    (tone: "neutral" | "success" | "warning" | "danger") => {
      if (tone === "success") return "bg-green-500/15 text-green-300 border border-green-500/30";
      if (tone === "warning") return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30";
      if (tone === "danger") return "bg-red-500/15 text-red-300 border border-red-500/30";
      return "bg-zinc-500/15 text-zinc-300 border border-zinc-500/30";
    },
    [],
  );

  const pushRecentMaterial = useCallback((materialId: string) => {
    setRecentMaterialIds((prev) => {
      const next = [materialId, ...prev.filter((id) => id !== materialId)];
      return next.slice(0, 8);
    });
    setMaterialUsageCounts((prev) => ({
      ...prev,
      [materialId]: (prev[materialId] ?? 0) + 1,
    }));
  }, []);

  const insertMaterialsIntoDraft = useCallback(
    (selections: DraftMaterialSelection[]) => {
      if (selections.length === 0) return;
      setFormItems((prev) => mergeSelectionsIntoDraftRows(prev, selections));
      selections.forEach(({ material }) => pushRecentMaterial(material._id));
    },
    [pushRecentMaterial],
  );

  const getRowMaterialSuggestions = useCallback(
    (item: FormDraftItem): MaterialType[] => {
      if (!item.categoryId) return [];
      const normalizedQuery = normalizeSearchText(item.materialSearchTerm);

      return materialTypes
        .filter((material) => {
          const sameCategory = extractCategoryId(material.categoryId) === item.categoryId;
          if (!sameCategory) return false;
          return getMaterialSearchScore(material, normalizedQuery) > 0;
        })
        .sort((a, b) => {
          const scoreDelta =
            getMaterialSearchScore(b, normalizedQuery) - getMaterialSearchScore(a, normalizedQuery);
          if (scoreDelta !== 0) return scoreDelta;

          const aAvailable = inventoryDataAvailable
            ? (materialAvailabilityByType.get(a._id)?.available ?? 0)
            : 1;
          const bAvailable = inventoryDataAvailable
            ? (materialAvailabilityByType.get(b._id)?.available ?? 0)
            : 1;
          if (aAvailable !== bAvailable) return bAvailable - aAvailable;

          const usageDelta = (materialUsageCounts[b._id] ?? 0) - (materialUsageCounts[a._id] ?? 0);
          if (usageDelta !== 0) return usageDelta;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);
    },
    [materialTypes, materialUsageCounts, materialAvailabilityByType, inventoryDataAvailable],
  );

  const recentMaterials = useMemo(
    () =>
      recentMaterialIds
        .map((id) => materialTypes.find((m) => m._id === id))
        .filter((entry): entry is MaterialType => Boolean(entry)),
    [materialTypes, recentMaterialIds],
  );

  const selectedPlan = useMemo(
    () => packages.find((pkg) => pkg._id === selectedPlanId),
    [packages, selectedPlanId],
  );

  const selectedPlanEntries = useMemo(
    () => (selectedPlan?.items?.length ? selectedPlan.items : selectedPlan?.materialTypes) ?? [],
    [selectedPlan],
  );

  const selectedPlanMaterialDetails = useMemo(
    () =>
      selectedPlanEntries.map((entry, index) => {
        const materialTypeId = extractMaterialTypeIdFromPackageEntry(entry);
        const material = materialTypeId
          ? materialTypes.find((item) => item._id === materialTypeId)
          : undefined;
        return {
          key: `${materialTypeId ?? "unknown"}-${index}`,
          quantity: Math.max(1, Number(entry.quantity) || 1),
          label: material?.name ?? materialTypeId ?? "Unknown material",
        };
      }),
    [selectedPlanEntries, materialTypes],
  );

  const selectedDraftById = useMemo(() => {
    const details = new Map<
      string,
      {
        name?: string;
        description?: string;
        unitPrice?: number;
        quantity: number;
        includes: string[];
      }
    >();
    formItems.forEach((item) => {
      const quantity = Number(item.quantity);
      const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
      const selectedMaterial = materialTypes.find((m) => m._id === item.materialTypeId);
      const selectedCategory = materialCategories.find((c) => c._id === item.categoryId);
      details.set(item.localId, {
        name: selectedMaterial?.name,
        description: selectedMaterial?.description,
        unitPrice: selectedMaterial?.pricePerDay,
        quantity: normalizedQuantity,
        includes: selectedCategory ? [selectedCategory.name] : [],
      });
    });
    return details;
  }, [formItems, materialCategories, materialTypes]);

  const selectedDraftRows = useMemo(
    () =>
      formItems
        .map((item) => ({ item, detail: selectedDraftById.get(item.localId) }))
        .filter(({ item, detail }) => Boolean(item.materialTypeId && detail?.name)),
    [formItems, selectedDraftById],
  );

  const estimatedDailyTotal = useMemo(
    () =>
      selectedDraftRows.reduce((sum, row) => {
        const unitPrice = row.detail?.unitPrice ?? 0;
        const qty = row.detail?.quantity ?? 1;
        return sum + unitPrice * qty;
      }, 0),
    [selectedDraftRows],
  );

  const rentalDays = useMemo(
    () => calculateRentalDays(formData.startDate, formData.endDate),
    [formData.endDate, formData.startDate],
  );

  const estimatedOrderTotal = useMemo(
    () => estimatedDailyTotal * rentalDays,
    [estimatedDailyTotal, rentalDays],
  );

  const hasCustomers = customers.length > 0;
  const hasSelectableItems = materialTypes.length > 0;

  const resetCreateForm = () => {
    setFormData(EMPTY_FORM);
    setFormItems([
      {
        localId: crypto.randomUUID(),
        categoryId: "",
        materialTypeId: "",
        materialSearchTerm: "",
        quantity: "1",
      },
    ]);
    setShowValidationErrors(false);
    setSelectedPlanId("");
  };

  const closeModal = () => {
    onClose();
    resetCreateForm();
  };

  const handleAddDraftItem = () => {
    setFormItems((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        categoryId: "",
        materialTypeId: "",
        materialSearchTerm: "",
        quantity: "1",
      },
    ]);
  };

  const handleDraftItemChange = (
    localId: string,
    updates: Partial<
      Pick<FormDraftItem, "categoryId" | "materialTypeId" | "materialSearchTerm" | "quantity">
    >,
  ) => {
    setFormItems((prev) => {
      if (typeof updates.materialTypeId === "string") {
        const selectedMaterial = materialTypes.find((m) => m._id === updates.materialTypeId);
        if (selectedMaterial) {
          if (!isMaterialSelectable(selectedMaterial._id)) {
            showError(
              `${selectedMaterial.name} is currently out of stock.`,
              "Material Unavailable",
            );
            return prev;
          }
          pushRecentMaterial(selectedMaterial._id);
          return applySelectedMaterialToDraftRows(prev, localId, selectedMaterial);
        }
      }
      return prev.map((item) => {
        if (item.localId !== localId) return item;
        if (typeof updates.categoryId === "string" && updates.categoryId !== item.categoryId) {
          return {
            ...item,
            categoryId: updates.categoryId,
            materialTypeId: "",
            materialSearchTerm: "",
          };
        }
        return { ...item, ...updates };
      });
    });
  };

  const handleDraftItemRemove = (localId: string) => {
    setFormItems((prev) => {
      const next = prev.filter((item) => item.localId !== localId);
      return next.length
        ? next
        : [
            {
              localId: crypto.randomUUID(),
              categoryId: "",
              materialTypeId: "",
              materialSearchTerm: "",
              quantity: "1",
            },
          ];
    });
  };

  const addMaterialAsRow = (material: MaterialType) => {
    if (!isMaterialSelectable(material._id)) {
      showError(`${material.name} is currently out of stock.`, "Material Unavailable");
      return;
    }
    insertMaterialsIntoDraft([{ material, quantity: 1 }]);
  };

  const handleAddPlanToDraft = () => {
    if (!selectedPlan) {
      showError("Select a material plan first.", "Material Plan");
      return;
    }
    const planEntries =
      (selectedPlan.items?.length ? selectedPlan.items : selectedPlan.materialTypes) ?? [];
    if (planEntries.length === 0) {
      showError("The selected plan does not contain material types.", "Material Plan");
      return;
    }

    const selections: DraftMaterialSelection[] = [];
    let missingCatalogCount = 0;
    let outOfStockCount = 0;

    planEntries.forEach((entry) => {
      const materialTypeId = extractMaterialTypeIdFromPackageEntry(entry);
      if (!materialTypeId) {
        missingCatalogCount += 1;
        return;
      }
      const material = materialTypes.find((item) => item._id === materialTypeId);
      if (!material) {
        missingCatalogCount += 1;
        return;
      }
      if (!isMaterialSelectable(material._id)) {
        outOfStockCount += 1;
        return;
      }
      selections.push({
        material,
        quantity: Math.max(1, Number(entry.quantity) || 1),
      });
    });

    if (selections.length === 0) {
      showError(
        "No materials from this plan can be added right now. Check stock and plan configuration.",
        "Material Plan",
      );
      return;
    }

    insertMaterialsIntoDraft(selections);
    showSuccess(
      `Added ${selections.length} material row${selections.length === 1 ? "" : "s"} from ${selectedPlan.name}.`,
      "Material Plan Added",
    );

    if (missingCatalogCount > 0 || outOfStockCount > 0) {
      showError(
        `${missingCatalogCount > 0 ? `${missingCatalogCount} not found in catalog` : ""}${
          missingCatalogCount > 0 && outOfStockCount > 0 ? " and " : ""
        }${outOfStockCount > 0 ? `${outOfStockCount} out of stock` : ""}.`,
        "Plan Added with Warnings",
      );
    }
  };

  const validateCreateOrderForm = useCallback((): CreateOrderValidationErrors => {
    const nextErrors: CreateOrderValidationErrors = { rows: {} };

    if (!formData.customerId) {
      nextErrors.customerId = "Select the customer for this order.";
    }

    const isDatetimeIncomplete = (val: string) => val && val.length < 16 && val.includes("T");

    if (!formData.startDate) {
      nextErrors.startDate = "Select a start date.";
    } else if (isDatetimeIncomplete(formData.startDate)) {
      nextErrors.startDate = "Please set both date and hour for the start time.";
    } else {
      const startDateTime = new Date(formData.startDate);
      const now = new Date();
      if (startDateTime <= now) {
        nextErrors.startDate = "Start date and time must be in the future.";
      }
    }

    if (!formData.endDate) {
      nextErrors.endDate = "Select an end date.";
    } else if (isDatetimeIncomplete(formData.endDate)) {
      nextErrors.endDate = "Please set both date and hour for the end time.";
    } else if (!formData.startDate) {
      nextErrors.endDate = "Please select a start date before choosing an end date.";
    } else if (formData.endDate < formData.startDate) {
      nextErrors.endDate = "End date and time must be after the start date and time.";
    }

    if (!formData.depositDueDate) {
      nextErrors.depositDueDate = "Select a deposit due date.";
    } else if (isDatetimeIncomplete(formData.depositDueDate)) {
      nextErrors.depositDueDate = "Please set both date and hour for the deposit due date.";
    } else if (formData.depositDueDate > formData.startDate) {
      nextErrors.depositDueDate = "Deposit due date must be before or on the start date.";
    }

    if (formData.depositAmount === "") {
      nextErrors.depositAmount = "Please enter a deposit amount (or 0 for no deposit conditions).";
    }

    const draftRowsToValidate = formItems.filter((item) => !isFormDraftItemEmpty(item));

    draftRowsToValidate.forEach((item) => {
      const rowErrors: DraftItemValidationErrors = {};
      if (!item.categoryId) rowErrors.categoryId = "Select a category.";
      if (!item.materialTypeId) {
        rowErrors.materialTypeId = "Select a material type.";
      } else if (!isMaterialSelectable(item.materialTypeId)) {
        rowErrors.materialTypeId = "This material is currently out of stock.";
      }
      const quantityValue = Number(item.quantity);
      if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
        rowErrors.quantity = "Quantity must be greater than 0.";
      }
      if (Object.keys(rowErrors).length > 0) {
        nextErrors.rows[item.localId] = rowErrors;
      }
    });

    const hasMaterialItems = draftRowsToValidate.some((item) => Boolean(item.materialTypeId));
    const hasPackageItem = Boolean(selectedPlanId);

    if (!hasMaterialItems && !hasPackageItem) {
      nextErrors.items = "Add at least one product or service item.";
    }

    return nextErrors;
  }, [formData, formItems, isMaterialSelectable, selectedPlanId]);

  const createErrors = useMemo(() => {
    if (!showValidationErrors) return { rows: {} } as CreateOrderValidationErrors;
    return validateCreateOrderForm();
  }, [showValidationErrors, validateCreateOrderForm]);

  const handleCreateOrder = async () => {
    setShowValidationErrors(true);
    const validationErrors = validateCreateOrderForm();

    const hasValidationErrors =
      Boolean(validationErrors.customerId) ||
      Boolean(validationErrors.startDate) ||
      Boolean(validationErrors.endDate) ||
      Boolean(validationErrors.depositDueDate) ||
      Boolean(validationErrors.items) ||
      Object.keys(validationErrors.rows).length > 0;

    if (hasValidationErrors) return;

    const parsedItems: LoanRequestItem[] = formItems
      .filter((item) => !isFormDraftItemEmpty(item))
      .filter((item) => item.materialTypeId)
      .map((item) => {
        const quantity = Number(item.quantity);
        const normalizedQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
        return {
          type: "material" as const,
          referenceId: item.materialTypeId,
          quantity: normalizedQuantity,
        };
      });

    if (selectedPlanId) {
      parsedItems.unshift({
        type: "package" as const,
        referenceId: selectedPlanId,
        packageId: selectedPlanId,
        quantity: 1,
      });
    }

    const payload: CreateLoanRequestPayload = {
      customerId: formData.customerId,
      items: parsedItems,
      startDate: toSafeStartDateIso(formData.startDate),
      endDate: toSafeEndDateIso(formData.endDate),
      depositDueDate: toSafeEndDateIso(formData.depositDueDate),
      depositAmount: Number(formData.depositAmount) || 0,
      notes: formData.notes.trim() || undefined,
    };

    await onSubmit(payload);
    closeModal();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="modal-overlay items-start md:items-center overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && closeModal()}
      >
        <div
          className="modal-content max-w-6xl w-full max-h-[calc(100vh-1rem)] md:max-h-[94vh] overflow-y-auto my-2 md:my-0"
          data-help-id="orders-form-create"
        >
          <div className="modal-header">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEs ? "Registrar Nuevo Pedido" : "Register New Order"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {isEs
                  ? "Registre pedidos presenciales y revise los detalles antes de crear la solicitud."
                  : "Register walk-in orders and review all details before creating the request."}
              </p>
            </div>
            <IconButton
              icon={X}
              onClick={closeModal}
              ariaLabel={isEs ? "Cerrar modal" : "Close create order modal"}
              intent="secondary"
            />
          </div>

          <div className="modal-body p-0">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]">
              {/* ── Left: Form ────────────────────────────────── */}
              <div className="p-6 md:p-7 space-y-6">
                {showValidationErrors && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {isEs
                      ? "Revise los campos resaltados para continuar."
                      : "Review the highlighted fields below to continue."}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer */}
                  <div className="form-group md:col-span-2">
                    <label className="form-label">{isEs ? "Cliente *" : "Customer *"}</label>
                    <select
                      data-help-id="orders-form-customer"
                      value={formData.customerId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerId: e.target.value,
                        }))
                      }
                      className={`input ${createErrors.customerId ? "input-error" : ""}`}
                    >
                      <option value="">{isEs ? "Seleccionar cliente" : "Select customer"}</option>
                      {customers.map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {`${customer.name.firstName} ${customer.name.firstSurname}`} -{" "}
                          {customer.email}
                        </option>
                      ))}
                    </select>
                    {createErrors.customerId && (
                      <p className="form-error">{createErrors.customerId}</p>
                    )}
                  </div>

                  {/* Start Date */}
                  <div className="form-group">
                    <label className="form-label">
                      {isEs ? "Fecha de inicio *" : "Start Date *"}
                    </label>
                    <input
                      data-help-id="orders-form-start-date"
                      type="datetime-local"
                      value={formData.startDate}
                      min={getTodayLocalDatetimeString()}
                      onChange={(e) =>
                        setFormData((prev) => {
                          const nextStartDate = e.target.value;
                          const nextEndDate =
                            prev.endDate && prev.endDate < nextStartDate
                              ? nextStartDate
                              : prev.endDate;
                          return {
                            ...prev,
                            startDate: nextStartDate,
                            endDate: nextEndDate,
                          };
                        })
                      }
                      className={`input ${createErrors.startDate ? "input-error" : ""}`}
                    />
                    {createErrors.startDate && (
                      <p className="form-error">{createErrors.startDate}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div className="form-group">
                    <label className="form-label">{isEs ? "Fecha de fin *" : "End Date *"}</label>
                    <input
                      data-help-id="orders-form-end-date"
                      type="datetime-local"
                      value={formData.endDate}
                      min={formData.startDate || getTodayLocalDatetimeString()}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className={`input ${createErrors.endDate ? "input-error" : ""}`}
                    />
                    {createErrors.endDate && <p className="form-error">{createErrors.endDate}</p>}
                  </div>

                  {/* Deposit Due Date */}
                  <div className="form-group">
                    <label className="form-label">
                      {isEs ? "Fecha límite del depósito *" : "Deposit Due Date *"}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.depositDueDate}
                      max={formData.startDate || undefined}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          depositDueDate: e.target.value,
                        }))
                      }
                      className={`input ${createErrors.depositDueDate ? "input-error" : ""}`}
                    />
                    {createErrors.depositDueDate && (
                      <p className="form-error">{createErrors.depositDueDate}</p>
                    )}
                  </div>

                  {/* Deposit Amount */}
                  <div className="form-group">
                    <label className="form-label">
                      {isEs ? "Monto del depósito (COP) *" : "Deposit Amount (COP) *"}
                    </label>
                    <input
                      data-help-id="orders-form-deposit-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 50.000,00"
                      value={depositAmountInput.displayValue}
                      onChange={depositAmountInput.handleChange}
                      onBlur={depositAmountInput.handleBlur}
                      className={`input ${createErrors.depositAmount ? "input-error" : ""}`}
                    />
                    {createErrors.depositAmount && (
                      <p className="form-error">{createErrors.depositAmount}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="form-group md:col-span-2">
                    <label className="form-label">{isEs ? "Notas" : "Notes"}</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="input min-h-[96px]"
                      placeholder={
                        isEs ? "Notas opcionales para este pedido" : "Optional notes for this order"
                      }
                    />
                  </div>
                </div>

                {/* ── Products & Services ──────────────────────── */}
                <div className="border border-[#333] rounded-lg p-4 space-y-4 bg-[#161616]">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h3 className="text-white font-semibold">
                      {isEs ? "Productos y Servicios *" : "Products and Services *"}
                    </h3>
                  </div>

                  {/* Material Plan */}
                  <div className="rounded-lg border border-[#333] bg-[#131313] p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      {isEs ? "Agregar desde plan de materiales" : "Add from Material Plan"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="input"
                        disabled={packages.length === 0}
                      >
                        <option value="">
                          {packages.length > 0
                            ? isEs
                              ? "Seleccionar un plan existente"
                              : "Select an existing plan"
                            : isEs
                              ? "No hay planes disponibles"
                              : "No material plans available"}
                        </option>
                        {packages.map((pkg) => {
                          const planItemCount =
                            (pkg.items?.length ?? 0) || (pkg.materialTypes?.length ?? 0);
                          return (
                            <option key={`plan-${pkg._id}`} value={pkg._id}>
                              {pkg.name} ({planItemCount} {isEs ? "artículos" : "items"})
                            </option>
                          );
                        })}
                      </select>
                      <Button
                        variant="secondary"
                        onClick={handleAddPlanToDraft}
                        disabled={!selectedPlanId || packages.length === 0}
                      >
                        {isEs ? "Importar materiales del plan" : "Import Plan Materials"}
                      </Button>
                    </div>
                    {selectedPlan && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-gray-400">
                          {selectedPlan.description?.trim()
                            ? selectedPlan.description
                            : isEs
                              ? "Este plan ya está incluido en el pedido como un paquete."
                              : "This plan is already included in the order as a package item. You can optionally import its materials as editable rows."}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPlanMaterialDetails.length === 0 ? (
                            <span className="text-[11px] px-2 py-1 rounded bg-[#1f1f1f] text-gray-300 border border-[#333]">
                              {isEs ? "Sin materiales configurados" : "No configured materials"}
                            </span>
                          ) : (
                            selectedPlanMaterialDetails.map((entry) => (
                              <span
                                key={`plan-entry-${entry.key}`}
                                className="text-[11px] px-2 py-1 rounded bg-[#1f1f1f] text-gray-300 border border-[#333]"
                              >
                                {entry.quantity}x {entry.label}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Draft item rows */}
                  <div className="space-y-3">
                    {createErrors.items && <p className="form-error">{createErrors.items}</p>}

                    {formItems.map((item) => (
                      <div
                        key={item.localId}
                        className="grid grid-cols-1 md:grid-cols-[220px_1fr_120px_44px_44px] gap-3 items-end"
                      >
                        {/* Category */}
                        <div className="form-group">
                          <label className="form-label">{isEs ? "Categoría" : "Category"}</label>
                          <select
                            value={item.categoryId}
                            onChange={(e) =>
                              handleDraftItemChange(item.localId, {
                                categoryId: e.target.value,
                              })
                            }
                            className={`input ${createErrors.rows[item.localId]?.categoryId ? "input-error" : ""}`}
                          >
                            <option value="">
                              {isEs ? "Seleccionar categoría" : "Select category"}
                            </option>
                            {materialCategories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          {createErrors.rows[item.localId]?.categoryId && (
                            <p className="form-error">
                              {createErrors.rows[item.localId]?.categoryId}
                            </p>
                          )}
                        </div>

                        {/* Material Type autocomplete */}
                        <div className="form-group">
                          <label className="form-label">
                            {isEs ? "Tipo de material" : "Material Type"}
                          </label>
                          {(() => {
                            const rowSuggestions = getRowMaterialSuggestions(item);
                            const hasQuery = item.materialSearchTerm.trim().length > 0;
                            const isOpen =
                              activeMaterialRowId === item.localId && Boolean(item.categoryId);

                            return (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.materialSearchTerm}
                                  onChange={(e) => {
                                    handleDraftItemChange(item.localId, {
                                      materialSearchTerm: e.target.value,
                                      materialTypeId: "",
                                    });
                                    setActiveMaterialRowId(item.localId);
                                    setActiveSuggestionIndex(0);
                                  }}
                                  onFocus={() => {
                                    setActiveMaterialRowId(item.localId);
                                    setActiveSuggestionIndex(0);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setActiveMaterialRowId((prev) =>
                                        prev === item.localId ? null : prev,
                                      );
                                    }, 120);
                                  }}
                                  onKeyDown={(e) => {
                                    if (!item.categoryId || rowSuggestions.length === 0) return;
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      setActiveMaterialRowId(item.localId);
                                      setActiveSuggestionIndex((prev) =>
                                        Math.min(prev + 1, rowSuggestions.length - 1),
                                      );
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                                    } else if (e.key === "Enter") {
                                      if (activeMaterialRowId !== item.localId) return;
                                      e.preventDefault();
                                      const selected =
                                        rowSuggestions[activeSuggestionIndex] ?? rowSuggestions[0];
                                      if (selected) {
                                        handleDraftItemChange(item.localId, {
                                          materialTypeId: selected._id,
                                        });
                                        setActiveMaterialRowId(null);
                                      }
                                    } else if (e.key === "Escape") {
                                      setActiveMaterialRowId(null);
                                    }
                                  }}
                                  placeholder={
                                    item.categoryId
                                      ? isEs
                                        ? "Buscar material..."
                                        : "Search material..."
                                      : isEs
                                        ? "Seleccione categoría primero"
                                        : "Select category first"
                                  }
                                  disabled={!item.categoryId}
                                  className={`input ${createErrors.rows[item.localId]?.materialTypeId ? "input-error" : ""}`}
                                />

                                {isOpen && (
                                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#333] bg-[#111] shadow-2xl">
                                    {hasQuery && (
                                      <p className="px-3 py-2 text-[11px] uppercase tracking-wide text-gray-500 border-b border-[#222]">
                                        {rowSuggestions.length} result
                                        {rowSuggestions.length === 1 ? "" : "s"}
                                      </p>
                                    )}
                                    {!hasQuery && (
                                      <p className="px-3 py-2 text-xs text-gray-500">
                                        {isEs
                                          ? "Escriba para buscar materiales."
                                          : "Type to search materials in real time."}
                                      </p>
                                    )}
                                    {hasQuery && rowSuggestions.length === 0 && (
                                      <p className="px-3 py-2 text-xs text-gray-500">
                                        {isEs
                                          ? "No se encontraron materiales."
                                          : "No materials found for this category."}
                                      </p>
                                    )}
                                    {rowSuggestions.map((material, suggestionIndex) => {
                                      const active = suggestionIndex === activeSuggestionIndex;
                                      return (
                                        <button
                                          key={`suggestion-${item.localId}-${material._id}`}
                                          type="button"
                                          onMouseDown={(mouseEvent) => {
                                            mouseEvent.preventDefault();
                                            handleDraftItemChange(item.localId, {
                                              materialTypeId: material._id,
                                            });
                                            setActiveMaterialRowId(null);
                                          }}
                                          className={`w-full text-left px-3 py-2 border-b border-[#222] last:border-b-0 transition-colors ${
                                            active
                                              ? "bg-[#FFD700]/15 text-[#FFD700]"
                                              : "text-gray-200 hover:bg-[#1b1b1b]"
                                          }`}
                                          disabled={!isMaterialSelectable(material._id)}
                                        >
                                          <span className="block text-sm font-medium truncate">
                                            {material.name}
                                          </span>
                                          <span className="block text-xs text-gray-400 truncate">
                                            {formatMoney(material.pricePerDay)} / day
                                          </span>
                                          {(() => {
                                            const availability = getMaterialAvailabilityLabel(
                                              material._id,
                                            );
                                            return (
                                              <span
                                                className={`mt-1 inline-flex text-[11px] px-1.5 py-0.5 rounded ${getAvailabilityBadgeClass(availability.tone)}`}
                                              >
                                                {availability.text}
                                              </span>
                                            );
                                          })()}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          {createErrors.rows[item.localId]?.materialTypeId && (
                            <p className="form-error">
                              {createErrors.rows[item.localId]?.materialTypeId}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="form-group">
                          <label className="form-label">{isEs ? "Cantidad" : "Quantity"}</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleDraftItemChange(item.localId, {
                                quantity: e.target.value,
                              })
                            }
                            className={`input ${createErrors.rows[item.localId]?.quantity ? "input-error" : ""}`}
                          />
                          {createErrors.rows[item.localId]?.quantity && (
                            <p className="form-error">
                              {createErrors.rows[item.localId]?.quantity}
                            </p>
                          )}
                        </div>

                        <IconButton
                          icon={Plus}
                          onClick={handleAddDraftItem}
                          intent="secondary"
                          className="bg-transparent text-[#FFD700] border-none hover:bg-[#FFD700]/10"
                          ariaLabel={isEs ? "Agregar nuevo artículo" : "Add new item"}
                        />
                        <IconButton
                          icon={Trash2}
                          onClick={() => handleDraftItemRemove(item.localId)}
                          intent="delete"
                          ariaLabel={isEs ? "Eliminar artículo" : "Remove item"}
                        />

                        {/* Selected item preview */}
                        {item.materialTypeId && selectedDraftById.get(item.localId)?.name && (
                          <div className="md:col-span-5 rounded-lg border border-[#3d3d3d] bg-[#121212] px-3 py-3 space-y-2">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <p className="text-sm font-semibold text-white">
                                {selectedDraftById.get(item.localId)?.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30">
                                  {formatMoney(selectedDraftById.get(item.localId)?.unitPrice)} /
                                  day
                                </span>
                                <span className="px-2 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                  Qty: {selectedDraftById.get(item.localId)?.quantity ?? 1}
                                </span>
                              </div>
                            </div>
                            {selectedDraftById.get(item.localId)?.description && (
                              <p className="text-xs text-gray-400">
                                {selectedDraftById.get(item.localId)?.description}
                              </p>
                            )}
                            {(selectedDraftById.get(item.localId)?.includes.length ?? 0) > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  {isEs ? "Categoría" : "Category"}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedDraftById.get(item.localId)?.includes.map((entry) => (
                                    <span
                                      key={`${item.localId}-${entry}`}
                                      className="text-[11px] px-2 py-1 rounded bg-[#1f1f1f] text-gray-300 border border-[#333]"
                                    >
                                      {entry}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Right: Sidebar ────────────────────────────── */}
              <aside className="border-t xl:border-t-0 xl:border-l border-[#333] bg-[#151515] p-6 space-y-5">
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {isEs ? "Borrador actual" : "Current Draft"}
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-gray-300">
                      {isEs ? "Filas:" : "Rows:"}{" "}
                      <span className="text-white font-semibold">{formItems.length}</span>
                    </p>
                    <p className="text-gray-300">
                      {isEs ? "Artículos seleccionados:" : "Selected Items:"}{" "}
                      <span className="text-white font-semibold">{selectedDraftRows.length}</span>
                    </p>
                    <p className="text-gray-300">
                      {isEs ? "Periodo de renta:" : "Rental period:"}{" "}
                      <span className="text-white font-semibold">
                        {rentalDays} {isEs ? "día" : "day"}
                        {rentalDays === 1 ? "" : isEs ? "s" : "s"}
                      </span>
                    </p>
                    <p className="text-gray-300">
                      {isEs ? "Subtotal diario:" : "Daily subtotal:"}{" "}
                      <span className="text-white font-semibold">
                        {formatMoney(estimatedDailyTotal)}
                      </span>
                    </p>
                    <p className="text-gray-300">
                      {isEs ? "Total estimado:" : "Estimated total:"}{" "}
                      <span className="text-white font-semibold">
                        {formatMoney(estimatedOrderTotal)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Recent Materials */}
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">
                    {isEs ? "Materiales Recientes" : "Recent Materials"}
                  </p>
                  {recentMaterials.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      {isEs
                        ? "Sus selecciones recientes aparecerán aquí."
                        : "Your most recent selections will appear here."}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recentMaterials.map((material) => (
                        <Button
                          key={`recent-${material._id}`}
                          variant="secondary"
                          size="sm"
                          onClick={() => addMaterialAsRow(material)}
                          title={`Add ${material.name}`}
                          disabled={!isMaterialSelectable(material._id)}
                          className={
                            !isMaterialSelectable(material._id)
                              ? "border-red-500/30 text-red-300"
                              : ""
                          }
                        >
                          {material.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <MaterialSelector
                  categories={materialCategories}
                  materials={materialTypes}
                  onAddMaterials={(selected) => {
                    const selections: DraftMaterialSelection[] = selected.map((material) => ({
                      material,
                      quantity: 1,
                    }));
                    insertMaterialsIntoDraft(selections);
                  }}
                  getAvailabilityLabel={getMaterialAvailabilityLabel}
                  getMaterialUsageCount={(id) => materialUsageCounts[id] ?? 0}
                  formatPrice={formatMoney}
                  recentMaterials={recentMaterials}
                  showPrice
                />

                {/* Cost Preview */}
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4 space-y-3">
                  <p className="text-sm font-semibold text-white">
                    {isEs ? "Vista previa de costos" : "Order Cost Preview"}
                  </p>
                  {selectedDraftRows.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      {isEs
                        ? "Seleccione productos para ver precios."
                        : "Select products or services to see real catalog pricing."}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedDraftRows.map(({ item, detail }) => {
                          const lineTotal = (detail?.unitPrice ?? 0) * (detail?.quantity ?? 1);
                          return (
                            <div
                              key={`summary-${item.localId}`}
                              className="text-xs border border-[#333] rounded-md p-2 bg-[#151515]"
                            >
                              <p className="text-gray-200 font-medium truncate">{detail?.name}</p>
                              <p className="text-gray-400 mt-1">
                                {detail?.quantity ?? 1} x {formatMoney(detail?.unitPrice)} ={" "}
                                {formatMoney(lineTotal)} / day
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-[#333] flex items-center justify-between">
                        <span className="text-sm text-gray-300">
                          {isEs ? "Total diario estimado" : "Estimated daily total"}
                        </span>
                        <span className="text-base font-semibold text-[#FFD700]">
                          {formatMoney(estimatedDailyTotal)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-[#333] flex items-center justify-between">
                        <span className="text-sm text-gray-300">
                          {isEs
                            ? `Total estimado (${rentalDays} día${rentalDays === 1 ? "" : "s"})`
                            : `Estimated total (${rentalDays} day${rentalDays === 1 ? "" : "s"})`}
                        </span>
                        <span className="text-base font-semibold text-[#FFD700]">
                          {formatMoney(estimatedOrderTotal)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {(!hasCustomers || !hasSelectableItems) && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-300">
                      {isEs ? "Faltan datos de configuración" : "Missing required setup data"}
                    </p>
                    <p className="text-xs text-red-200/90">
                      {isEs
                        ? "Necesita al menos un cliente y un tipo de material para crear pedidos."
                        : "You need at least one customer and one material type to create orders."}
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>

          <div className="modal-footer">
            <Button
              variant="secondary"
              onClick={closeModal}
              disabled={submitting}
              data-help-id="orders-form-cancel"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </Button>
            <Button
              onClick={handleCreateOrder}
              loading={submitting}
              disabled={!hasCustomers || !hasSelectableItems}
              data-help-id="orders-form-submit"
            >
              {submitting
                ? isEs
                  ? "Creando..."
                  : "Creating..."
                : isEs
                  ? "Crear Pedido"
                  : "Create Order"}
            </Button>
          </div>
        </div>
      </div>
      <AlertModal />
    </>
  );
}
