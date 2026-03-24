import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Package,
  Download,
  Calculator,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getSubscriptionTypesAdminAll,
  createSubscriptionType,
  updateSubscriptionType,
  deleteSubscriptionType,
  calculatePlanCost,
} from "../../../services/subscriptionTypeService";
import {
  LoadingSpinner,
  ErrorDisplay,
  ConfirmDialog,
  EmptyState,
  AlertContainer,
} from "../../../components/ui";
import { AdminPagination, AdminTable } from "../../app/components";
import { normalizeError, logError } from "../../../utils/errorHandling";
import {
  validatePlanIdentifier,
  validatePlanDisplayName,
  validateCostCents,
  validateLimitField,
  validateDurationDays,
  validateSortOrder,
  validatePlanDescription,
  validateStripePriceId,
} from "../../../utils/validators";
import { useAuth } from "../../../contexts/useAuth";
import { useLanguage } from "../../../contexts/useLanguage";
import { useAlerts } from "../../../hooks/useAlerts";
import { useAlertModal } from "../../../hooks/useAlertModal";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, PLAN_CONFIGURATION_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import type {
  SubscriptionType,
  CreateSubscriptionTypePayload,
  BillingModel,
  SubscriptionStatus,
  PlanCostResult,
} from "../../../types/api";

// ─── Reusable form primitives ───────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-400 mb-1.5">
        {label}
        {required && <span className="text-[#FFD700] ml-0.5">*</span>}
        {hint && <span className="ml-1 text-xs font-normal text-gray-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] outline-none transition";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TextInput({ error: _err, className = "", ...props }: TextInputProps) {
  return <input className={`${inputCls} ${className}`} {...props} />;
}

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function NumberInput({ error: _err, className = "", ...props }: NumberInputProps) {
  return <input type="number" className={`${inputCls} ${className}`} {...props} />;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SelectInput({ options, error: _err, className = "", ...props }: SelectInputProps) {
  return (
    <select className={`${inputCls} ${className}`} {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface TextareaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TextareaInput({ error: _err, className = "", ...props }: TextareaInputProps) {
  return <textarea className={`${inputCls} resize-none ${className}`} {...props} />;
}

// ─── Features list editor ──────────────────────────────────────────────────

interface FeaturesEditorProps {
  features: string[];
  onChange: (features: string[]) => void;
  isEs: boolean;
}
function FeaturesEditor({ features, onChange, isEs }: FeaturesEditorProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed || features.includes(trimmed)) return;
    onChange([...features, trimmed]);
    setDraft("");
  };

  const remove = (idx: number) => onChange(features.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={isEs ? "Agrega una funcionalidad y presiona Enter..." : "Add a feature and press Enter..."}
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 text-sm font-semibold rounded-lg transition whitespace-nowrap gold-action-btn"
        >
          {isEs ? "+ Agregar" : "+ Add"}
        </button>
      </div>
      {features.length > 0 && (
        <ul className="space-y-1.5">
          {features.map((feat, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm bg-[#1a1a1a] px-3 py-1.5 rounded-lg"
            >
              <span className="text-green-400">✓</span>
              <span className="text-gray-300 flex-1">{feat}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1 danger-icon-btn"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Cost calculator ───────────────────────────────────────────────────────

interface CostCalculatorProps {
  planId: string;
  isEs: boolean;
}
function CostCalculator({ planId, isEs }: CostCalculatorProps) {
  const [seats, setSeats] = useState(1);
  const [result, setResult] = useState<PlanCostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const calculate = async () => {
    if (seats < 1) return;
    try {
      setLoading(true);
      setError("");
      const res = await calculatePlanCost(planId, seats);
      setResult(res.data);
    } catch (err: unknown) {
      setError(normalizeError(err).message);
      logError(err, "CostCalculator");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 border-t border-[#333] pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#FFD700] transition"
      >
        <Calculator size={13} />
        {isEs ? "Calculadora de costos" : "Cost calculator"}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <NumberInput
              min={1}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="w-24"
            />
            <button
              type="button"
              onClick={calculate}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition disabled:opacity-50 gold-action-btn"
            >
              {loading ? "..." : isEs ? "Calcular" : "Calculate"}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {result && (
            <div className="text-xs space-y-0.5 text-gray-400">
              <p>
                {isEs ? "Base" : "Base"}: <span className="text-white">${(result.baseCost / 100).toFixed(2)}</span>
              </p>
              <p>
                {isEs ? "Asientos" : "Seats"} ({result.seatCount}):{" "}
                <span className="text-white">${(result.seatCost / 100).toFixed(2)}</span>
              </p>
              <p className="font-semibold text-[#FFD700]">
                {isEs ? "Total" : "Total"}: ${(result.totalCost / 100).toFixed(2)} {result.currency.toUpperCase()}/{isEs ? "mes" : "mo"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Validation ─────────────────────────────────────────────────────────────

interface PlanValidationErrors {
  plan?: string;
  displayName?: string;
  description?: string;
  baseCost?: string;
  pricePerSeat?: string;
  maxSeats?: string;
  maxCatalogItems?: string;
  durationDays?: string;
  billingModel?: string;
  sortOrder?: string;
  stripePriceIdBase?: string;
  stripePriceIdSeat?: string;
}

function validatePlanFields(
  fields: Partial<CreateSubscriptionTypePayload>,
  isCreate = false,
): PlanValidationErrors {
  const errors: PlanValidationErrors = {};

  if (isCreate && fields.plan !== undefined) {
    const r = validatePlanIdentifier(fields.plan);
    if (!r.isValid) errors.plan = r.message;
  }

  if (fields.displayName !== undefined) {
    const r = validatePlanDisplayName(fields.displayName);
    if (!r.isValid) errors.displayName = r.message;
  }

  if (fields.description !== undefined) {
    const r = validatePlanDescription(fields.description);
    if (!r.isValid) errors.description = r.message;
  }

  if (fields.baseCost !== undefined) {
    const r = validateCostCents(fields.baseCost, "Base cost");
    if (!r.isValid) errors.baseCost = r.message;
  }

  if (fields.pricePerSeat !== undefined) {
    const r = validateCostCents(fields.pricePerSeat, "Price per seat");
    if (!r.isValid) errors.pricePerSeat = r.message;
  }

  if (fields.maxSeats !== undefined) {
    const r = validateLimitField(fields.maxSeats, "Max seats");
    if (!r.isValid) errors.maxSeats = r.message;
  }

  if (fields.maxCatalogItems !== undefined) {
    const r = validateLimitField(fields.maxCatalogItems, "Max catalog items");
    if (!r.isValid) errors.maxCatalogItems = r.message;
  }

  if (fields.durationDays !== undefined) {
    const r = validateDurationDays(fields.durationDays);
    if (!r.isValid) errors.durationDays = r.message;
  }

  if (isCreate && (fields.durationDays === undefined || fields.durationDays === null)) {
    errors.durationDays = "Duration is required.";
  }

  if (fields.sortOrder !== undefined) {
    const r = validateSortOrder(fields.sortOrder);
    if (!r.isValid) errors.sortOrder = r.message;
  }

  if (fields.stripePriceIdBase !== undefined) {
    const r = validateStripePriceId(fields.stripePriceIdBase);
    if (!r.isValid) errors.stripePriceIdBase = r.message;
  }

  if (fields.stripePriceIdSeat !== undefined) {
    const r = validateStripePriceId(fields.stripePriceIdSeat);
    if (!r.isValid) errors.stripePriceIdSeat = r.message;
  }

  if (isCreate && !fields.billingModel) {
    errors.billingModel = "Billing model is required.";
  }

  return errors;
}

function hasErrors(errors: PlanValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// --- Helpers ----------------------------------------------------------------

function formatDollars(cents: number | null | undefined, locale: string): string {
  if (cents === null || cents === undefined) return "No price";
  const dollars = cents / 100;
  return dollars.toLocaleString(locale, {
    minimumFractionDigits: dollars < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

type SubscriptionTypeApi = SubscriptionType & { basePriceMonthly?: number };
type SubscriptionTypeWithDates = SubscriptionType & { createdAt?: string };

const INACTIVE_PAGE_SIZE = 10;

function normalizePlan(plan: SubscriptionTypeApi): SubscriptionType {
  if (plan.baseCost !== null && plan.baseCost !== undefined) return plan;
  if (plan.basePriceMonthly === null || plan.basePriceMonthly === undefined) return plan;

  return {
    ...plan,
    baseCost: Math.round(plan.basePriceMonthly * 100),
    pricePerSeat:
      plan.pricePerSeat === null || plan.pricePerSeat === undefined
        ? plan.pricePerSeat
        : Math.round(plan.pricePerSeat * 100),
  };
}

const CARD_BORDER: Record<string, string> = {
  starter: "border-[#333]",
  professional: "border-[#FFD700]",
  enterprise: "border-[#333]",
};

const DEFAULT_CREATE_STATE: Partial<CreateSubscriptionTypePayload> = {
  billingModel: "dynamic",
  baseCost: 0,
  pricePerSeat: 0,
  maxSeats: -1,
  maxCatalogItems: -1,
  durationDays: 30,
  sortOrder: 0,
  status: "active",
  features: [],
  stripePriceIdBase: "",
  stripePriceIdSeat: "",
};

type CreateBillingModelOption = BillingModel | "free";

const FREE_PLAN_PRESET: Partial<CreateSubscriptionTypePayload> = {
  billingModel: "fixed",
  displayName: "Free",
  description: "Great to get started: essential features with controlled limits for small teams.",
  baseCost: 0,
  pricePerSeat: 0,
  maxSeats: 3,
  maxCatalogItems: 50,
  sortOrder: 0,
  status: "active",
  features: [
    "Up to 3 users",
    "Up to 50 catalog items",
    "Basic inventory management",
    "Email support",
  ],
  stripePriceIdBase: "",
  stripePriceIdSeat: "",
};

// ─── Edit-fields type (all patchable fields) ────────────────────────────────
type EditFields = Partial<Omit<SubscriptionType, "_id" | "plan">>;

// ---------------------------------------------------------------------------

export default function PlanConfiguration() {
  const { language, locale } = useLanguage();
  const isEs = language === "es";
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Edit mode
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({});
  const [validationErrors, setValidationErrors] = useState<PlanValidationErrors>({});
  const [saving, setSaving] = useState(false);

  // Create mode
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createBillingModel, setCreateBillingModel] = useState<CreateBillingModelOption>("dynamic");
  const [createFields, setCreateFields] =
    useState<Partial<CreateSubscriptionTypePayload>>(DEFAULT_CREATE_STATE);
  const [createErrors, setCreateErrors] = useState<PlanValidationErrors>({});
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ plan: string; displayName: string } | null>(
    null,
  );
  const [rowActionLoading, setRowActionLoading] = useState<Record<string, boolean>>({});
  const [selectedInactivePlanId, setSelectedInactivePlanId] = useState<string | null>(null);

  // Inactive plans filters and pagination
  const [inactiveSearch, setInactiveSearch] = useState("");
  const [inactiveMinPrice, setInactiveMinPrice] = useState("");
  const [inactiveMaxPrice, setInactiveMaxPrice] = useState("");
  const [inactiveDurationFilter, setInactiveDurationFilter] = useState("all");
  const [inactivePage, setInactivePage] = useState(1);

  // Export state
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | undefined>();
  const exportAbort = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const { alerts, showAlert, dismissAlert } = useAlerts();
  const { showError, showWarning, AlertModal } = useAlertModal();

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSubscriptionTypesAdminAll();
      const normalized = res.data.subscriptionTypes.map((plan) =>
        normalizePlan(plan as SubscriptionTypeApi),
      );
      setPlans(normalized);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, "PlanConfiguration.fetchPlans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  /** Build flat export rows from plans array. */
  const buildExportRows = useCallback((): Record<string, unknown>[] => {
    return plans.map((p) => ({
      _id: p._id,
      plan: p.plan,
      displayName: p.displayName,
      description: p.description,
      billingModel: p.billingModel,
      baseCost: p.baseCost,
      pricePerSeat: p.pricePerSeat,
      maxSeats: p.maxSeats,
      maxCatalogItems: p.maxCatalogItems,
      durationDays: p.durationDays,
      features: p.features,
      sortOrder: p.sortOrder,
      status: p.status,
    }));
  }, [plans]);

  const handleExport = useCallback(
    async (config: ExportConfig) => {
      const rawData = buildExportRows();
      if (rawData.length === 0) {
        showAlert("warning", isEs ? "No hay planes para exportar." : "No plans available to export.");
        return;
      }
      const abort = new AbortController();
      exportAbort.current = abort;
      setExporting(true);
      setExportProgress(undefined);

      const result = await exportService.export(
        rawData,
        config,
        user?.id ?? "anonymous",
        (p) => setExportProgress(p),
        abort.signal,
      );

      setExporting(false);
      setExportProgress(undefined);
      exportAbort.current = null;

      if (result.status === "success") {
        showAlert(
          "success",
          isEs
            ? `Se exportaron ${result.metadata.recordCount} planes como ${result.filename}`
            : `Exported ${result.metadata.recordCount} plans as ${result.filename}`,
        );
        setExportOpen(false);
      } else if (result.status === "cancelled") {
        showAlert("info", result.reason);
      } else {
        showAlert("error", result.error);
      }
    },
    [buildExportRows, user?.id, showAlert],
  );

  const handleExportPreview = useCallback(
    async (config: ExportConfig) => {
      const rawData = buildExportRows();
      if (rawData.length === 0) return undefined;
      return exportService.preview(rawData, config, user?.id ?? "anonymous");
    },
    [buildExportRows, user?.id],
  );

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  /**
   * Validate a single create-form field live and patch createErrors.
   * Pass `nextFields` containing the just-updated value so state timing
   * is never an issue.
   */
  const liveCreateField = useCallback(
    (key: keyof PlanValidationErrors, nextFields: Partial<CreateSubscriptionTypePayload>) => {
      const isCreateField = key === "plan" || key === "durationDays" || key === "billingModel";
      const errs = validatePlanFields(nextFields, isCreateField);
      setCreateErrors((prev) => ({ ...prev, [key]: errs[key] }));
    },
    [],
  );

  /**
   * Validate a single edit-card field live and patch validationErrors.
   */
  const liveEditField = useCallback(
    (key: keyof PlanValidationErrors, nextFields: Partial<CreateSubscriptionTypePayload>) => {
      const errs = validatePlanFields(nextFields, false);
      setValidationErrors((prev) => ({ ...prev, [key]: errs[key] }));
    },
    [],
  );

  // Start editing a plan — populate ALL patchable fields
  const startEdit = (plan: SubscriptionType) => {
    setEditingPlan(plan.plan);
    setEditFields({
      displayName: plan.displayName,
      description: plan.description ?? "",
      billingModel: plan.billingModel,
      baseCost: plan.baseCost,
      pricePerSeat: plan.pricePerSeat,
      maxSeats: plan.maxSeats,
      maxCatalogItems: plan.maxCatalogItems,
      durationDays: plan.durationDays,
      features: [...plan.features],
      sortOrder: plan.sortOrder,
      stripePriceIdBase: plan.stripePriceIdBase ?? "",
      stripePriceIdSeat: plan.stripePriceIdSeat ?? "",
      status: plan.status,
    });
    setValidationErrors({});
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPlan(null);
    setEditFields({});
    setValidationErrors({});
  };

  // Save edits
  const saveEdit = async () => {
    if (!editingPlan) return;

    const errors = validatePlanFields(editFields, false);
    setValidationErrors(errors);
    if (hasErrors(errors)) return;

    try {
      setSaving(true);
      await updateSubscriptionType(editingPlan, {
        displayName: editFields.displayName,
        description: editFields.description,
        billingModel: editFields.billingModel,
        baseCost: editFields.baseCost,
        pricePerSeat: editFields.pricePerSeat,
        maxSeats: editFields.maxSeats,
        maxCatalogItems: editFields.maxCatalogItems,
        durationDays: editFields.durationDays,
        features: editFields.features,
        sortOrder: editFields.sortOrder,
        stripePriceIdBase: editFields.stripePriceIdBase || undefined,
        stripePriceIdSeat: editFields.stripePriceIdSeat || undefined,
        status: editFields.status,
      });
      setEditingPlan(null);
      setEditFields({});
      showAlert("success", isEs ? "Plan actualizado correctamente." : "Plan updated successfully.");
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, "PlanConfiguration.saveEdit");
    } finally {
      setSaving(false);
    }
  };

  // Create new plan
  const handleCreate = async () => {
    const errors = validatePlanFields(createFields, true);
    setCreateErrors(errors);
    if (hasErrors(errors)) return;

    if (!createFields.plan || !createFields.displayName || !createFields.billingModel) {
      showWarning(isEs ? "Completa todos los campos obligatorios." : "Please fill in all required fields.");
      return;
    }

    try {
      setCreating(true);
      await createSubscriptionType({
        plan: createFields.plan,
        displayName: createFields.displayName,
        description: createFields.description,
        billingModel:
          createBillingModel === "free" ? "fixed" : (createFields.billingModel as BillingModel),
        baseCost:
          createBillingModel === "free"
            ? (FREE_PLAN_PRESET.baseCost ?? 0)
            : (createFields.baseCost ?? 0),
        pricePerSeat:
          createBillingModel === "free"
            ? (FREE_PLAN_PRESET.pricePerSeat ?? 0)
            : (createFields.pricePerSeat ?? 0),
        maxSeats:
          createBillingModel === "free"
            ? (FREE_PLAN_PRESET.maxSeats ?? 3)
            : (createFields.maxSeats ?? -1),
        maxCatalogItems:
          createBillingModel === "free"
            ? (FREE_PLAN_PRESET.maxCatalogItems ?? 50)
            : (createFields.maxCatalogItems ?? -1),
        durationDays: createFields.durationDays ?? 30,
        features:
          createBillingModel === "free"
            ? (createFields.features ?? FREE_PLAN_PRESET.features ?? [])
            : (createFields.features ?? []),
        sortOrder: createFields.sortOrder ?? 0,
        stripePriceIdBase:
          createBillingModel === "free" ? undefined : createFields.stripePriceIdBase || undefined,
        stripePriceIdSeat:
          createBillingModel === "free" ? undefined : createFields.stripePriceIdSeat || undefined,
        status: createFields.status,
      });

      setShowCreateForm(false);
      setCreateBillingModel("dynamic");
      setCreateFields(DEFAULT_CREATE_STATE);
      setCreateErrors({});
      showAlert(
        "success",
        isEs ? `Plan "${createFields.displayName}" creado.` : `Plan "${createFields.displayName}" created.`,
      );
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, "PlanConfiguration.handleCreate");
    } finally {
      setCreating(false);
    }
  };

  // Cancel create
  const cancelCreate = () => {
    setShowCreateForm(false);
    setCreateBillingModel("dynamic");
    setCreateFields(DEFAULT_CREATE_STATE);
    setCreateErrors({});
  };

  // Confirm and delete plan
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteSubscriptionType(deleteConfirm.plan);
      setDeleteConfirm(null);
      showAlert(
        "success",
        isEs
          ? `Plan "${deleteConfirm.displayName}" desactivado.`
          : `Plan "${deleteConfirm.displayName}" deactivated.`,
      );
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, "PlanConfiguration.handleDelete");
    }
  };

  const setActionBusy = (key: string, busy: boolean) => {
    setRowActionLoading((prev) => ({ ...prev, [key]: busy }));
  };

  const handleActivatePlan = async (plan: SubscriptionType) => {
    const key = `activate:${plan.plan}`;
    try {
      setActionBusy(key, true);
      await updateSubscriptionType(plan.plan, { status: "active" });
      showAlert(
        "success",
        isEs ? `Plan "${plan.displayName}" activado.` : `Plan "${plan.displayName}" activated.`,
      );
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, "PlanConfiguration.handleActivatePlan");
    } finally {
      setActionBusy(key, false);
    }
  };

  const activeAndDeprecatedPlans = useMemo(
    () => plans.filter((plan) => plan.status !== "inactive"),
    [plans],
  );

  const filteredInactivePlans = useMemo(() => {
    const term = inactiveSearch.trim().toLowerCase();
    const minPriceCents = inactiveMinPrice === "" ? null : Math.round(Number(inactiveMinPrice) * 100);
    const maxPriceCents = inactiveMaxPrice === "" ? null : Math.round(Number(inactiveMaxPrice) * 100);

    return plans
      .filter((plan) => plan.status === "inactive")
      .filter((plan) => {
        if (term) {
          const label = `${plan.displayName} ${plan.plan}`.toLowerCase();
          if (!label.includes(term)) return false;
        }

        const monthlyCost = (plan.baseCost ?? 0) + (plan.pricePerSeat ?? 0);
        if (minPriceCents !== null && !Number.isNaN(minPriceCents) && monthlyCost < minPriceCents) {
          return false;
        }
        if (maxPriceCents !== null && !Number.isNaN(maxPriceCents) && monthlyCost > maxPriceCents) {
          return false;
        }

        if (inactiveDurationFilter !== "all" && plan.durationDays !== Number(inactiveDurationFilter)) {
          return false;
        }

        return true;
      });
  }, [plans, inactiveSearch, inactiveMinPrice, inactiveMaxPrice, inactiveDurationFilter]);

  const inactiveTotalPages = Math.max(1, Math.ceil(filteredInactivePlans.length / INACTIVE_PAGE_SIZE));
  const paginatedInactivePlans = useMemo(() => {
    const start = (inactivePage - 1) * INACTIVE_PAGE_SIZE;
    return filteredInactivePlans.slice(start, start + INACTIVE_PAGE_SIZE);
  }, [filteredInactivePlans, inactivePage]);
  const selectedInactivePlan = useMemo(
    () => filteredInactivePlans.find((plan) => plan._id === selectedInactivePlanId) ?? null,
    [filteredInactivePlans, selectedInactivePlanId],
  );

  useEffect(() => {
    setInactivePage(1);
  }, [inactiveSearch, inactiveMinPrice, inactiveMaxPrice, inactiveDurationFilter]);

  useEffect(() => {
    if (inactivePage > inactiveTotalPages) {
      setInactivePage(inactiveTotalPages);
    }
  }, [inactivePage, inactiveTotalPages]);

  useEffect(() => {
    if (selectedInactivePlanId && !filteredInactivePlans.some((plan) => plan._id === selectedInactivePlanId)) {
      setSelectedInactivePlanId(null);
    }
  }, [selectedInactivePlanId, filteredInactivePlans]);

  // Render loading state
  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        message={isEs ? "Cargando planes de suscripcion..." : "Loading subscription plans..."}
      />
    );
  }

  // Render error state
  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchPlans} fullScreen />;
  }

  // Render empty state
  if (plans.length === 0 && !showCreateForm) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {isEs ? "Configuracion de planes" : "Plan Configuration"}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEs
              ? "Gestiona planes de suscripcion, precios y funcionalidades"
              : "Manage subscription plans, pricing, and features"}
          </p>
        </div>
        <EmptyState
          icon={Package}
          title={isEs ? "No hay planes de suscripcion" : "No subscription plans"}
          description={
            isEs
              ? "Comienza creando tu primer plan de suscripcion para organizaciones."
              : "Get started by creating your first subscription plan for organizations."
          }
          action={{ label: isEs ? "Crear plan" : "Create Plan", onClick: () => setShowCreateForm(true) }}
        />
      </div>
    );
  }

  // ─── Shared options ──────────────────────────────────────────────────────
  const billingModelOptions = [
    {
      value: "dynamic",
      label: isEs ? "Dinamico (precio por usuario)" : "Dynamic (per-seat pricing)",
    },
    { value: "fixed", label: isEs ? "Fijo (tarifa plana)" : "Fixed (flat rate)" },
    { value: "free", label: isEs ? "Gratis (sin costos)" : "Free (no cost fields)" },
  ];
  const statusOptions: { value: SubscriptionStatus; label: string }[] = [
    { value: "active", label: isEs ? "Activo" : "Active" },
    { value: "inactive", label: isEs ? "Inactivo" : "Inactive" },
    { value: "deprecated", label: isEs ? "Obsoleto" : "Deprecated" },
  ];

  return (
    <div>
      {/* Alerts */}
      <AlertContainer alerts={alerts} onDismiss={dismissAlert} position="top-right" />

      {/* Export Modal */}
      <ExportSettingsModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={(config) => void handleExport(config)}
        onPreview={handleExportPreview}
        module="plan-configuration"
        policy={PLAN_CONFIGURATION_POLICY}
        allowedFormats={["xlsx"]}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {isEs ? "Configuracion de planes" : "Plan Configuration"}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEs
              ? "Gestiona planes de suscripcion, precios y funcionalidades"
              : "Manage subscription plans, pricing, and features"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="export-btn flex items-center gap-2"
          >
            <Download size={18} />
            {isEs ? "Exportar" : "Export"}
          </button>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg transition gold-action-btn"
            >
              <Plus size={18} />
              {isEs ? "Crear plan" : "Create Plan"}
            </button>
          )}
        </div>
      </div>

      {/* ── Create Form ──────────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="bg-[#121212] border border-[#FFD700] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-5">
            {isEs ? "Crear nuevo plan" : "Create New Plan"}
          </h2>

          {/* Row 1 – identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Field
              label={isEs ? "Nombre del plan" : "Subscription Name"}
              required
              hint={isEs ? "minusculas, alfanumerico, guiones bajos" : "lowercase, alphanumeric, underscores"}
              error={createErrors.plan}
            >
              <TextInput
                value={createFields.plan ?? ""}
                onChange={(e) => {
                  const updated = { ...createFields, plan: e.target.value.toLowerCase() };
                  setCreateFields(updated);
                  if (createErrors.plan !== undefined) liveCreateField("plan", updated);
                }}
                onBlur={() => liveCreateField("plan", { plan: createFields.plan ?? "" })}
                placeholder={isEs ? "ej., premium_pro" : "e.g., premium_pro"}
              />
            </Field>

            <Field label={isEs ? "Nombre visible" : "Display Name"} required error={createErrors.displayName}>
              <TextInput
                value={createFields.displayName ?? ""}
                onChange={(e) => {
                  const updated = { ...createFields, displayName: e.target.value };
                  setCreateFields(updated);
                  if (createErrors.displayName !== undefined) liveCreateField("displayName", updated);
                }}
                onBlur={() =>
                  liveCreateField("displayName", { displayName: createFields.displayName ?? "" })
                }
                placeholder={isEs ? "ej., Premium Pro" : "e.g., Premium Pro"}
              />
            </Field>

            <Field label={isEs ? "Modelo de cobro" : "Billing Model"} required error={createErrors.billingModel}>
              <SelectInput
                options={billingModelOptions}
                value={createBillingModel}
                onChange={(e) => {
                  const selected = e.target.value as CreateBillingModelOption;
                  setCreateBillingModel(selected);
                  setCreateFields((f) => {
                    if (selected === "free") {
                      return {
                        ...f,
                        plan: f.plan?.trim() ? f.plan : "free",
                        displayName: f.displayName?.trim()
                          ? f.displayName
                          : (FREE_PLAN_PRESET.displayName ?? "Free"),
                        description: f.description?.trim() || (FREE_PLAN_PRESET.description ?? ""),
                        billingModel: "fixed",
                        baseCost: FREE_PLAN_PRESET.baseCost ?? 0,
                        pricePerSeat: FREE_PLAN_PRESET.pricePerSeat ?? 0,
                        maxSeats: FREE_PLAN_PRESET.maxSeats ?? 3,
                        maxCatalogItems: FREE_PLAN_PRESET.maxCatalogItems ?? 50,
                        features:
                          f.features && f.features.length > 0
                            ? f.features
                            : (FREE_PLAN_PRESET.features ?? []),
                        status: f.status ?? FREE_PLAN_PRESET.status,
                        sortOrder: f.sortOrder ?? FREE_PLAN_PRESET.sortOrder,
                        stripePriceIdBase: "",
                        stripePriceIdSeat: "",
                      };
                    }

                    if (createBillingModel === "free") {
                      return {
                        ...f,
                        plan: "",
                        displayName: "",
                        billingModel: selected as BillingModel,
                        baseCost: 0,
                        pricePerSeat: 0,
                        maxSeats: -1,
                        maxCatalogItems: -1,
                        description: "",
                        features: [],
                        stripePriceIdBase: "",
                        stripePriceIdSeat: "",
                      };
                    }

                    return { ...f, billingModel: selected as BillingModel };
                  });
                }}
              />
            </Field>
          </div>

          {createBillingModel === "free" && (
            <div className="mb-4 rounded-lg border border-green-600/40 bg-green-900/10 p-4">
              <p className="text-sm font-semibold text-green-400 mb-2">
                {isEs ? "Plan gratuito predefinido" : "Predefined Free Plan"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-300">
                <p>
                  {isEs ? "Costo base" : "Base cost"}: <span className="text-white">{isEs ? "Gratis" : "Free"}</span>
                </p>
                <p>
                  {isEs ? "Precio por asiento" : "Price per seat"}: <span className="text-white">{isEs ? "Gratis" : "Free"}</span>
                </p>
                <p>
                  {isEs ? "Usuarios" : "Users"}: <span className="text-white">{createFields.maxSeats ?? 3}</span>
                </p>
                <p>
                  {isEs ? "Catalogo" : "Catalog"}: <span className="text-white">{createFields.maxCatalogItems ?? 50}</span>
                </p>
                <p>
                  {isEs ? "Estado" : "Status"}:{" "}
                  <span className="text-white capitalize">{createFields.status ?? "active"}</span>
                </p>
              </div>
            </div>
          )}

          {/* Row 2 – pricing */}
          {createBillingModel !== "free" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label={isEs ? "Costo base" : "Base Cost"} hint={isEs ? "centavos" : "cents"} required error={createErrors.baseCost}>
                <NumberInput
                  min={0}
                  value={createFields.baseCost ?? 0}
                  onChange={(e) => {
                    const updated = { ...createFields, baseCost: Number(e.target.value) };
                    setCreateFields(updated);
                    if (createErrors.baseCost !== undefined) liveCreateField("baseCost", updated);
                  }}
                  onBlur={() =>
                    liveCreateField("baseCost", { baseCost: createFields.baseCost ?? 0 })
                  }
                />
              </Field>

              <Field label={isEs ? "Precio por asiento" : "Price Per Seat"} hint={isEs ? "centavos" : "cents"} error={createErrors.pricePerSeat}>
                <NumberInput
                  min={0}
                  value={createFields.pricePerSeat ?? 0}
                  onChange={(e) => {
                    const updated = { ...createFields, pricePerSeat: Number(e.target.value) };
                    setCreateFields(updated);
                    if (createErrors.pricePerSeat !== undefined)
                      liveCreateField("pricePerSeat", updated);
                  }}
                  onBlur={() =>
                    liveCreateField("pricePerSeat", {
                      pricePerSeat: createFields.pricePerSeat ?? 0,
                    })
                  }
                />
              </Field>

              <Field label={isEs ? "Max asientos" : "Max Seats"} hint={isEs ? "-1 = ilimitado" : "-1 = unlimited"} error={createErrors.maxSeats}>
                <NumberInput
                  value={createFields.maxSeats ?? -1}
                  onChange={(e) => {
                    const updated = { ...createFields, maxSeats: Number(e.target.value) };
                    setCreateFields(updated);
                    if (createErrors.maxSeats !== undefined) liveCreateField("maxSeats", updated);
                  }}
                  onBlur={() =>
                    liveCreateField("maxSeats", { maxSeats: createFields.maxSeats ?? -1 })
                  }
                />
              </Field>

              <Field
                label={isEs ? "Max items de catalogo" : "Max Catalog Items"}
                hint={isEs ? "-1 = ilimitado" : "-1 = unlimited"}
                error={createErrors.maxCatalogItems}
              >
                <NumberInput
                  value={createFields.maxCatalogItems ?? -1}
                  onChange={(e) => {
                    const updated = { ...createFields, maxCatalogItems: Number(e.target.value) };
                    setCreateFields(updated);
                    if (createErrors.maxCatalogItems !== undefined)
                      liveCreateField("maxCatalogItems", updated);
                  }}
                  onBlur={() =>
                    liveCreateField("maxCatalogItems", {
                      maxCatalogItems: createFields.maxCatalogItems ?? -1,
                    })
                  }
                />
              </Field>
            </div>
          )}

          {/* Row 3 – meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Field label={isEs ? "Duracion (dias)" : "Duration (days)"} required hint="1–365" error={createErrors.durationDays}>
              <NumberInput
                min={1}
                max={365}
                value={createFields.durationDays ?? 30}
                onChange={(e) => {
                  const updated = { ...createFields, durationDays: Number(e.target.value) };
                  setCreateFields(updated);
                  if (createErrors.durationDays !== undefined)
                    liveCreateField("durationDays", updated);
                }}
                onBlur={() =>
                  liveCreateField("durationDays", {
                    durationDays: createFields.durationDays ?? 30,
                  })
                }
              />
            </Field>

            <Field label={isEs ? "Orden" : "Sort Order"} error={createErrors.sortOrder}>
              <NumberInput
                value={createFields.sortOrder ?? 0}
                onChange={(e) => {
                  const updated = { ...createFields, sortOrder: Number(e.target.value) };
                  setCreateFields(updated);
                  if (createErrors.sortOrder !== undefined) liveCreateField("sortOrder", updated);
                }}
                onBlur={() =>
                  liveCreateField("sortOrder", { sortOrder: createFields.sortOrder ?? 0 })
                }
              />
            </Field>

            <Field label={isEs ? "Estado" : "Status"}>
              <SelectInput
                options={statusOptions}
                value={createFields.status ?? "active"}
                onChange={(e) =>
                  setCreateFields((f) => ({ ...f, status: e.target.value as SubscriptionStatus }))
                }
              />
            </Field>

            {createBillingModel !== "free" && (
              <>
                <Field label={isEs ? "ID Stripe precio base" : "Stripe Base Price ID"} error={createErrors.stripePriceIdBase}>
                  <TextInput
                    value={createFields.stripePriceIdBase ?? ""}
                    onChange={(e) => {
                      const updated = { ...createFields, stripePriceIdBase: e.target.value };
                      setCreateFields(updated);
                      if (createErrors.stripePriceIdBase !== undefined)
                        liveCreateField("stripePriceIdBase", updated);
                    }}
                    onBlur={() =>
                      liveCreateField("stripePriceIdBase", {
                        stripePriceIdBase: createFields.stripePriceIdBase ?? "",
                      })
                    }
                    placeholder="price_…"
                  />
                </Field>

                <Field label={isEs ? "ID Stripe precio por asiento" : "Stripe Seat Price ID"} error={createErrors.stripePriceIdSeat}>
                  <TextInput
                    value={createFields.stripePriceIdSeat ?? ""}
                    onChange={(e) => {
                      const updated = { ...createFields, stripePriceIdSeat: e.target.value };
                      setCreateFields(updated);
                      if (createErrors.stripePriceIdSeat !== undefined)
                        liveCreateField("stripePriceIdSeat", updated);
                    }}
                    onBlur={() =>
                      liveCreateField("stripePriceIdSeat", {
                        stripePriceIdSeat: createFields.stripePriceIdSeat ?? "",
                      })
                    }
                    placeholder="price_…"
                  />
                </Field>
              </>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <Field label={isEs ? "Descripcion" : "Description"} hint={isEs ? "max 500 caracteres" : "max 500 chars"} error={createErrors.description}>
              <TextareaInput
                value={createFields.description ?? ""}
                onChange={(e) => {
                  const updated = { ...createFields, description: e.target.value };
                  setCreateFields(updated);
                  if (createErrors.description !== undefined)
                    liveCreateField("description", updated);
                }}
                onBlur={() =>
                  liveCreateField("description", {
                    description: createFields.description ?? "",
                  })
                }
                rows={2}
                maxLength={500}
                placeholder={isEs ? "Descripcion breve de este plan..." : "Brief description of this plan..."}
              />
            </Field>
          </div>

          {/* Features */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-400 mb-1.5">{isEs ? "Funcionalidades" : "Features"}</label>
            <FeaturesEditor
              features={createFields.features ?? []}
              isEs={isEs}
              onChange={(features) => setCreateFields((f) => ({ ...f, features }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333]">
            <button
              onClick={cancelCreate}
              disabled={creating}
              className="px-5 py-2.5 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] hover:text-white transition font-medium disabled:opacity-50"
            >
              {isEs ? "Cancelar" : "Cancel"}
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 font-semibold rounded-lg transition disabled:opacity-50 gold-action-btn"
            >
              {creating ? (
                isEs ? "Creando..." : "Creating..."
              ) : (
                <>
                  <Plus size={16} /> {isEs ? "Crear plan" : "Create Plan"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Plan Cards ───────────────────────────────────────────────────── */}
      {activeAndDeprecatedPlans.length === 0 && (
        <div className="bg-[#121212] border border-[#333] rounded-xl p-6 mb-6">
          <p className="text-sm text-gray-400">
            {isEs
              ? "No hay planes activos ni obsoletos para mostrar en tarjetas. Usa la tabla de inactivos para reactivarlos."
              : "There are no active or deprecated plans to show as cards. Use the inactive plans table below to reactivate plans."}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeAndDeprecatedPlans.map((plan) => {
          const isEditing = editingPlan === plan.plan;
          const border = CARD_BORDER[plan.plan] ?? "border-[#333]";

          return (
            <div
              key={plan.plan}
              className={`bg-[#121212] border ${isEditing ? "border-[#FFD700]" : border} rounded-xl p-5 flex flex-col transition`}
            >
              {/* ── Card Header ─────────────────────────────────── */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-2">
                  {isEditing ? (
                    <Field label={isEs ? "Nombre visible" : "Display Name"} required error={validationErrors.displayName}>
                      <TextInput
                        value={editFields.displayName ?? ""}
                        onChange={(e) => {
                          const updated = { ...editFields, displayName: e.target.value } as Partial<CreateSubscriptionTypePayload>;
                          setEditFields((f) => ({ ...f, displayName: e.target.value }));
                          if (validationErrors.displayName !== undefined)
                            liveEditField("displayName", updated);
                        }}
                        onBlur={() =>
                          liveEditField("displayName", {
                            displayName: editFields.displayName ?? "",
                          })
                        }
                        maxLength={100}
                      />
                    </Field>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-white truncate">{plan.displayName}</h3>
                      <code className="text-xs text-gray-500 font-mono">{plan.plan}</code>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {isEditing ? (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => void saveEdit()}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg bg-green-900/30 hover:bg-green-900/50 flex items-center justify-center text-green-400 transition disabled:opacity-50"
                      title={isEs ? "Guardar" : "Save"}
                    >
                      {saving ? <span className="text-xs">…</span> : <Check size={15} />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="w-8 h-8 rounded-lg bg-red-900/30 hover:bg-red-900/50 flex items-center justify-center text-red-400 transition"
                      title={isEs ? "Cancelar" : "Cancel"}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(plan)}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-[#FFD700] transition"
                      title={isEs ? "Editar plan" : "Edit plan"}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ plan: plan.plan, displayName: plan.displayName })
                      }
                      className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 flex items-center justify-center text-red-400 transition"
                      title={isEs ? "Desactivar plan" : "Deactivate plan"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Pricing ─────────────────────────────────────── */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Field label={isEs ? "Costo base" : "Base Cost"} hint="¢" error={validationErrors.baseCost}>
                    <NumberInput
                      min={0}
                      value={editFields.baseCost ?? 0}
                      onChange={(e) => {
                        const updated = { baseCost: Number(e.target.value) };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.baseCost !== undefined) liveEditField("baseCost", updated);
                      }}
                      onBlur={() => liveEditField("baseCost", { baseCost: editFields.baseCost ?? 0 })}
                    />
                  </Field>
                  <Field label={isEs ? "Precio / asiento" : "Price / Seat"} hint="¢" error={validationErrors.pricePerSeat}>
                    <NumberInput
                      min={0}
                      value={editFields.pricePerSeat ?? 0}
                      onChange={(e) => {
                        const updated = { pricePerSeat: Number(e.target.value) };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.pricePerSeat !== undefined)
                          liveEditField("pricePerSeat", updated);
                      }}
                      onBlur={() =>
                        liveEditField("pricePerSeat", { pricePerSeat: editFields.pricePerSeat ?? 0 })
                      }
                    />
                  </Field>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 mb-1">
                  {plan.baseCost === 0 && plan.pricePerSeat === 0 ? (
                    <span className="text-2xl font-extrabold text-green-400">{isEs ? "Gratis" : "Free"}</span>
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold text-white">
                        ${formatDollars(plan.baseCost, locale)}
                      </span>
                      <span className="text-gray-500 text-xs">/{isEs ? "mes" : "month"}</span>
                      {plan.pricePerSeat > 0 && (
                        <span className="text-gray-500 text-xs ml-1">
                          +${formatDollars(plan.pricePerSeat, locale)}/{isEs ? "asiento" : "seat"}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Status badge (read-only) or selector (edit) */}
              {isEditing ? (
                <div className="mb-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Field label={isEs ? "Estado" : "Status"}>
                        <SelectInput
                          options={statusOptions}
                          value={editFields.status ?? "active"}
                          onChange={(e) =>
                            setEditFields((f) => ({
                              ...f,
                              status: e.target.value as SubscriptionStatus,
                            }))
                          }
                        />
                      </Field>
                    </div>
                    <div className="flex-1">
                      <Field label={isEs ? "Modelo de cobro" : "Billing Model"} error={validationErrors.billingModel}>
                        <SelectInput
                          options={billingModelOptions}
                          value={editFields.billingModel ?? "dynamic"}
                          onChange={(e) =>
                            setEditFields((f) => ({
                              ...f,
                              billingModel: e.target.value as BillingModel,
                            }))
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      plan.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : plan.status === "deprecated"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-600/20 text-gray-400"
                    }`}
                  >
                    {plan.status}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{plan.billingModel}</span>
                </div>
              )}

              <hr className="border-[#333] my-3" />

              {/* ── Limits ──────────────────────────────────────── */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label={isEs ? "Max asientos" : "Max Seats"} hint="-1 = ∞" error={validationErrors.maxSeats}>
                    <NumberInput
                      value={editFields.maxSeats ?? -1}
                      onChange={(e) => {
                        const updated = { maxSeats: Number(e.target.value) };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.maxSeats !== undefined) liveEditField("maxSeats", updated);
                      }}
                      onBlur={() => liveEditField("maxSeats", { maxSeats: editFields.maxSeats ?? -1 })}
                    />
                  </Field>
                  <Field
                    label={isEs ? "Max items de catalogo" : "Max Catalog Items"}
                    hint="-1 = ∞"
                    error={validationErrors.maxCatalogItems}
                  >
                    <NumberInput
                      value={editFields.maxCatalogItems ?? -1}
                      onChange={(e) => {
                        const updated = { maxCatalogItems: Number(e.target.value) };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.maxCatalogItems !== undefined)
                          liveEditField("maxCatalogItems", updated);
                      }}
                      onBlur={() =>
                        liveEditField("maxCatalogItems", {
                          maxCatalogItems: editFields.maxCatalogItems ?? -1,
                        })
                      }
                    />
                  </Field>
                  <Field label={isEs ? "Duracion (dias)" : "Duration (days)"} hint="1–365" error={validationErrors.durationDays}>
                    <NumberInput
                      min={1}
                      max={365}
                      value={editFields.durationDays ?? 30}
                      onChange={(e) => {
                        const updated = { durationDays: Number(e.target.value) };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.durationDays !== undefined)
                          liveEditField("durationDays", updated);
                      }}
                      onBlur={() =>
                        liveEditField("durationDays", {
                          durationDays: editFields.durationDays ?? 30,
                        })
                      }
                    />
                  </Field>
                  <Field label={isEs ? "Orden" : "Sort Order"} error={validationErrors.sortOrder}>
                    <NumberInput
                      value={editFields.sortOrder ?? 0}
                      onChange={(e) => {
                        const updated = { sortOrder: Number(e.target.value) };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.sortOrder !== undefined)
                          liveEditField("sortOrder", updated);
                      }}
                      onBlur={() =>
                        liveEditField("sortOrder", { sortOrder: editFields.sortOrder ?? 0 })
                      }
                    />
                  </Field>
                </div>
              ) : (
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-1 mb-3">
                  <p>
                    Seats:{" "}
                    <span className="text-white">{plan.maxSeats === -1 ? "∞" : plan.maxSeats}</span>
                  </p>
                  <p>
                    Items:{" "}
                    <span className="text-white">
                      {plan.maxCatalogItems === -1 ? "∞" : plan.maxCatalogItems}
                    </span>
                  </p>
                  <p>
                    Duration: <span className="text-white">{plan.durationDays} days</span>
                  </p>
                  <p>
                    Sort: <span className="text-white">{plan.sortOrder}</span>
                  </p>
                </div>
              )}

              {/* ── Description ─────────────────────────────────── */}
              {isEditing ? (
                <div className="mb-3">
                  <Field
                    label={isEs ? "Descripcion" : "Description"}
                    hint={isEs ? "max 500 caracteres" : "max 500 chars"}
                    error={validationErrors.description}
                  >
                    <TextareaInput
                      value={editFields.description ?? ""}
                      onChange={(e) => {
                        const updated = { description: e.target.value };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.description !== undefined)
                          liveEditField("description", updated);
                      }}
                      onBlur={() =>
                        liveEditField("description", {
                          description: editFields.description ?? "",
                        })
                      }
                      rows={2}
                      maxLength={500}
                    />
                  </Field>
                </div>
              ) : (
                plan.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{plan.description}</p>
                )
              )}

              {/* ── Features ────────────────────────────────────── */}
              <div className="flex-1 mb-3">
                {isEditing ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {isEs ? "Funcionalidades" : "Features"}
                    </label>
                    <FeaturesEditor
                      features={editFields.features ?? []}
                      isEs={isEs}
                      onChange={(features) => setEditFields((f) => ({ ...f, features }))}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{isEs ? "Funcionalidades" : "Features"}</p>
                    {plan.features.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">{isEs ? "Sin funcionalidades" : "No features listed"}</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-green-400 mt-0.5">✓</span>
                            <span className="text-gray-300">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              {/* ── Stripe IDs (edit only) ───────────────────────── */}
              {isEditing && (
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <Field label={isEs ? "ID Stripe precio base" : "Stripe Base Price ID"} error={validationErrors.stripePriceIdBase}>
                    <TextInput
                      value={editFields.stripePriceIdBase ?? ""}
                      onChange={(e) => {
                        const updated = { stripePriceIdBase: e.target.value };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.stripePriceIdBase !== undefined)
                          liveEditField("stripePriceIdBase", updated);
                      }}
                      onBlur={() =>
                        liveEditField("stripePriceIdBase", {
                          stripePriceIdBase: editFields.stripePriceIdBase ?? "",
                        })
                      }
                      placeholder="price_…"
                    />
                  </Field>
                  <Field label={isEs ? "ID Stripe precio por asiento" : "Stripe Seat Price ID"} error={validationErrors.stripePriceIdSeat}>
                    <TextInput
                      value={editFields.stripePriceIdSeat ?? ""}
                      onChange={(e) => {
                        const updated = { stripePriceIdSeat: e.target.value };
                        setEditFields((f) => ({ ...f, ...updated }));
                        if (validationErrors.stripePriceIdSeat !== undefined)
                          liveEditField("stripePriceIdSeat", updated);
                      }}
                      onBlur={() =>
                        liveEditField("stripePriceIdSeat", {
                          stripePriceIdSeat: editFields.stripePriceIdSeat ?? "",
                        })
                      }
                      placeholder="price_…"
                    />
                  </Field>
                </div>
              )}

              {/* ── Read-only Stripe IDs ─────────────────────────── */}
              {!isEditing && (plan.stripePriceIdBase || plan.stripePriceIdSeat) && (
                <div className="text-xs text-gray-600 space-y-0.5 mb-3">
                  {plan.stripePriceIdBase && (
                    <p>
                      {isEs ? "ID base" : "Base ID"}: <span className="font-mono">{plan.stripePriceIdBase}</span>
                    </p>
                  )}
                  {plan.stripePriceIdSeat && (
                    <p>
                      {isEs ? "ID asiento" : "Seat ID"}: <span className="font-mono">{plan.stripePriceIdSeat}</span>
                    </p>
                  )}
                </div>
              )}

              {/* ── Cost Calculator (view mode only) ────────────── */}
              {!isEditing && <CostCalculator planId={plan.plan} isEs={isEs} />}
            </div>
          );
        })}
      </div>

      {/* ── Inactive Plans Table ─────────────────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">{isEs ? "Planes inactivos" : "Inactive Plans"}</h2>
          <p className="text-gray-400 mt-1">
            {isEs
              ? "Gestiona planes inactivos: reactivalos o revisa sus detalles completos."
              : "Manage inactive plans: reactivate them or review complete details in a child view."}
          </p>
        </div>

        <div className="bg-[#121212] border border-[#333] rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={inactiveSearch}
            onChange={(e) => setInactiveSearch(e.target.value)}
            placeholder={isEs ? "Buscar por nombre visible o id del plan..." : "Search by display name or plan id..."}
            className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 w-64 focus:outline-none focus:border-[#FFD700]"
          />

          <input
            type="number"
            min={0}
            step="0.01"
            value={inactiveMinPrice}
            onChange={(e) => setInactiveMinPrice(e.target.value)}
            placeholder={isEs ? "Precio minimo (USD)" : "Min price (USD)"}
            className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 w-40 focus:outline-none focus:border-[#FFD700]"
          />

          <input
            type="number"
            min={0}
            step="0.01"
            value={inactiveMaxPrice}
            onChange={(e) => setInactiveMaxPrice(e.target.value)}
            placeholder={isEs ? "Precio maximo (USD)" : "Max price (USD)"}
            className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 w-40 focus:outline-none focus:border-[#FFD700]"
          />

          <select
            value={inactiveDurationFilter}
            onChange={(e) => setInactiveDurationFilter(e.target.value)}
            className="bg-[#1a1a1a] border border-[#444] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]"
          >
            <option value="all">{isEs ? "Todas las duraciones" : "All durations"}</option>
            <option value="30">30 {isEs ? "dias" : "days"}</option>
            <option value="90">90 {isEs ? "dias" : "days"}</option>
            <option value="180">180 {isEs ? "dias" : "days"}</option>
            <option value="365">365 {isEs ? "dias" : "days"}</option>
          </select>

          {(inactiveSearch.trim() || inactiveMinPrice || inactiveMaxPrice || inactiveDurationFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setInactiveSearch("");
                setInactiveMinPrice("");
                setInactiveMaxPrice("");
                setInactiveDurationFilter("all");
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {isEs ? "Limpiar filtros" : "Clear filters"}
            </button>
          )}

          <span className="ml-auto text-xs text-gray-500">
            {filteredInactivePlans.length} {isEs ? "planes inactivos" : "inactive plans"}
          </span>
        </div>

        <AdminTable>
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Plan" : "Plan"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Precio" : "Price"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Duracion" : "Duration"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Estado" : "Status"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium">{isEs ? "Creado" : "Created"}</th>
              <th className="px-4 py-3 text-gray-400 font-medium text-right">{isEs ? "Acciones" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInactivePlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {isEs ? "No hay planes inactivos para los filtros actuales." : "No inactive plans match the current filters."}
                </td>
              </tr>
            ) : (
              paginatedInactivePlans.map((plan) => {
                const createdAt = (plan as SubscriptionTypeWithDates).createdAt;
                const activateKey = `activate:${plan.plan}`;

                return (
                  <tr
                    key={plan._id}
                    className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{plan.displayName}</p>
                      <code className="text-xs text-gray-500">{plan.plan}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {plan.baseCost === 0 && plan.pricePerSeat === 0
                        ? isEs
                          ? "Gratis"
                          : "Free"
                        : `$${formatDollars(plan.baseCost, locale)}${plan.pricePerSeat > 0 ? ` + $${formatDollars(plan.pricePerSeat, locale)}/${isEs ? "asiento" : "seat"}` : ""}`}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{plan.durationDays} {isEs ? "dias" : "days"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-600/20 text-gray-400">
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {createdAt ? new Date(createdAt).toLocaleDateString(locale) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleActivatePlan(plan)}
                          disabled={!!rowActionLoading[activateKey]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/30 hover:bg-green-900/50 text-green-300 text-xs font-semibold transition disabled:opacity-50"
                        >
                          <RotateCcw size={13} />
                          {rowActionLoading[activateKey] ? (isEs ? "Activando..." : "Activating...") : (isEs ? "Activar" : "Activate")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedInactivePlanId(plan._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-200 text-xs font-semibold transition"
                        >
                          <Eye size={13} />
                          {isEs ? "Ver detalles" : "View details"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </AdminTable>

        <AdminPagination
          currentPage={inactivePage}
          totalPages={inactiveTotalPages}
          totalItems={filteredInactivePlans.length}
          pageSize={INACTIVE_PAGE_SIZE}
          itemLabel={isEs ? "planes inactivos" : "inactive plans"}
          onPageChange={setInactivePage}
        />
      </div>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          void handleDelete();
        }}
        title={isEs ? "Desactivar plan" : "Deactivate Plan"}
        message={
          isEs
            ? `Seguro que deseas desactivar el plan "${deleteConfirm?.displayName}"? Ya no sera visible para nuevos clientes, pero las suscripciones existentes no se veran afectadas.`
            : `Are you sure you want to deactivate the "${deleteConfirm?.displayName}" plan? It will no longer be visible to new customers, but existing subscriptions will not be affected.`
        }
        confirmText={isEs ? "Desactivar" : "Deactivate"}
        variant="danger"
      />

      {selectedInactivePlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInactivePlanId(null);
          }}
        >
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#121212] border border-[#333] rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{isEs ? "Detalles del plan" : "Plan Details"}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEs ? "Informacion detallada de" : "Detailed information for"} <span className="text-gray-300">{selectedInactivePlan.displayName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInactivePlanId(null)}
                aria-label={isEs ? "Cerrar detalles" : "Close details"}
                title={isEs ? "Cerrar" : "Close"}
                className="w-9 h-9 rounded-lg border border-[#333] text-gray-300 hover:bg-[#1a1a1a] hover:text-white transition flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "ID del plan" : "Plan ID"}</p>
                <p className="text-white font-medium">{selectedInactivePlan.plan}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Nombre visible" : "Display Name"}</p>
                <p className="text-white font-medium">{selectedInactivePlan.displayName}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Estado" : "Status"}</p>
                <p className="text-gray-300 capitalize">{selectedInactivePlan.status}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Costo base" : "Base Cost"}</p>
                <p className="text-gray-300">${formatDollars(selectedInactivePlan.baseCost, locale)}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Costo por asiento" : "Seat Cost"}</p>
                <p className="text-gray-300">
                  {selectedInactivePlan.pricePerSeat > 0
                    ? `$${formatDollars(selectedInactivePlan.pricePerSeat, locale)}`
                    : isEs
                      ? "Sin cobro por asiento"
                      : "No per-seat charge"}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Duracion" : "Duration"}</p>
                <p className="text-gray-300">{selectedInactivePlan.durationDays} {isEs ? "dias" : "days"}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Max asientos" : "Max Seats"}</p>
                <p className="text-gray-300">{selectedInactivePlan.maxSeats === -1 ? (isEs ? "Ilimitado" : "Unlimited") : selectedInactivePlan.maxSeats}</p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Max items de catalogo" : "Max Catalog Items"}</p>
                <p className="text-gray-300">
                  {selectedInactivePlan.maxCatalogItems === -1
                    ? isEs
                      ? "Ilimitado"
                      : "Unlimited"
                    : selectedInactivePlan.maxCatalogItems}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs">{isEs ? "Modelo de cobro" : "Billing Model"}</p>
                <p className="text-gray-300 capitalize">{selectedInactivePlan.billingModel}</p>
              </div>
            </div>

            {selectedInactivePlan.description && (
              <div className="mt-3 bg-[#1a1a1a] rounded-lg p-3">
                <p className="text-gray-500 text-xs mb-1">{isEs ? "Descripcion" : "Description"}</p>
                <p className="text-gray-300 text-sm">{selectedInactivePlan.description}</p>
              </div>
            )}

            <div className="mt-3 bg-[#1a1a1a] rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-1">{isEs ? "Funcionalidades" : "Features"}</p>
              {selectedInactivePlan.features.length === 0 ? (
                <p className="text-gray-500 text-sm italic">{isEs ? "Sin funcionalidades" : "No features listed"}</p>
              ) : (
                <ul className="space-y-1">
                  {selectedInactivePlan.features.map((feature, idx) => (
                    <li key={idx} className="text-gray-300 text-sm">
                      • {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal />
    </div>
  );
}
