import { useEffect, useState, useCallback, useRef } from "react";
import { Pencil, Check, X, Plus, Trash2, Package, Download, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import {
  getSubscriptionTypes,
  createSubscriptionType,
  updateSubscriptionType,
  deleteSubscriptionType,
  calculatePlanCost,
} from "../../../services/subscriptionTypeService";
import { LoadingSpinner, ErrorDisplay, ConfirmDialog, EmptyState, AlertContainer } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAuth } from "../../../contexts/useAuth";
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
function TextInput({ error: _err, className = "", ...props }: TextInputProps) {
  return <input className={`${inputCls} ${className}`} {...props} />;
}

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
function NumberInput({ error: _err, className = "", ...props }: NumberInputProps) {
  return <input type="number" className={`${inputCls} ${className}`} {...props} />;
}

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  error?: boolean;
}
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
function TextareaInput({ error: _err, className = "", ...props }: TextareaInputProps) {
  return (
    <textarea
      className={`${inputCls} resize-none ${className}`}
      {...props}
    />
  );
}

// ─── Features list editor ──────────────────────────────────────────────────

interface FeaturesEditorProps {
  features: string[];
  onChange: (features: string[]) => void;
}
function FeaturesEditor({ features, onChange }: FeaturesEditorProps) {
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
          placeholder="Add a feature and press Enter…"
          className={`${inputCls} flex-1`}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-[#FFD700] text-black text-sm font-semibold rounded-lg hover:bg-yellow-300 transition whitespace-nowrap"
        >
          + Add
        </button>
      </div>
      {features.length > 0 && (
        <ul className="space-y-1.5">
          {features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2 text-sm bg-[#1a1a1a] px-3 py-1.5 rounded-lg">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300 flex-1">{feat}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-300 transition"
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
}
function CostCalculator({ planId }: CostCalculatorProps) {
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
        Cost calculator
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
              className="px-3 py-1.5 bg-[#FFD700] text-black text-xs font-semibold rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading ? "…" : "Calculate"}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {result && (
            <div className="text-xs space-y-0.5 text-gray-400">
              <p>Base: <span className="text-white">${(result.baseCost / 100).toFixed(2)}</span></p>
              <p>Seats ({result.seatCount}): <span className="text-white">${(result.seatCost / 100).toFixed(2)}</span></p>
              <p className="font-semibold text-[#FFD700]">Total: ${(result.totalCost / 100).toFixed(2)} {result.currency.toUpperCase()}/mo</p>
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
  billingModel?: string;
  sortOrder?: string;
  stripePriceIdBase?: string;
  stripePriceIdSeat?: string;
}

function validatePlanFields(
  fields: Partial<CreateSubscriptionTypePayload>,
  isCreate = false
): PlanValidationErrors {
  const errors: PlanValidationErrors = {};

  if (isCreate && fields.plan !== undefined) {
    const plan = fields.plan.trim();
    if (!plan) {
      errors.plan = "Plan identifier is required.";
    } else if (!/^[a-z][a-z0-9_]*$/.test(plan)) {
      errors.plan = "Must be lowercase alphanumeric with underscores.";
    } else if (plan.length > 50) {
      errors.plan = "Max 50 characters.";
    }
  }

  if (fields.displayName !== undefined) {
    const name = fields.displayName.trim();
    if (!name) errors.displayName = "Display name is required.";
    else if (name.length > 100) errors.displayName = "Max 100 characters.";
  }

  if (fields.description !== undefined && fields.description.length > 500) {
    errors.description = "Max 500 characters.";
  }

  if (fields.baseCost !== undefined) {
    if (!Number.isFinite(fields.baseCost) || fields.baseCost < 0) {
      errors.baseCost = "Must be a non-negative number (in cents).";
    }
  }

  if (fields.pricePerSeat !== undefined) {
    if (!Number.isFinite(fields.pricePerSeat) || fields.pricePerSeat < 0) {
      errors.pricePerSeat = "Must be a non-negative number (in cents).";
    }
  }

  if (fields.maxSeats !== undefined) {
    if (!Number.isInteger(fields.maxSeats) || fields.maxSeats < -1) {
      errors.maxSeats = "Must be -1 (unlimited) or a positive integer.";
    }
  }

  if (fields.maxCatalogItems !== undefined) {
    if (!Number.isInteger(fields.maxCatalogItems) || fields.maxCatalogItems < -1) {
      errors.maxCatalogItems = "Must be -1 (unlimited) or a positive integer.";
    }
  }

  if (fields.sortOrder !== undefined && !Number.isInteger(fields.sortOrder)) {
    errors.sortOrder = "Must be an integer.";
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

function formatDollars(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "No price";
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    minimumFractionDigits: dollars < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

type SubscriptionTypeApi = SubscriptionType & { basePriceMonthly?: number };

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
  billingModel: 'dynamic',
  baseCost: 0,
  pricePerSeat: 0,
  maxSeats: -1,
  maxCatalogItems: -1,
  sortOrder: 0,
  status: 'active',
  features: [],
  stripePriceIdBase: '',
  stripePriceIdSeat: '',
};

// ─── Edit-fields type (all patchable fields) ────────────────────────────────
type EditFields = Partial<Omit<SubscriptionType, '_id' | 'plan'>>;

// ---------------------------------------------------------------------------

export default function PlanConfiguration() {
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
  const [createFields, setCreateFields] = useState<Partial<CreateSubscriptionTypePayload>>(DEFAULT_CREATE_STATE);
  const [createErrors, setCreateErrors] = useState<PlanValidationErrors>({});
  const [creating, setCreating] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ plan: string; displayName: string } | null>(null);

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
      const res = await getSubscriptionTypes();
      const normalized = res.data.subscriptionTypes.map((plan) =>
        normalizePlan(plan as SubscriptionTypeApi),
      );
      setPlans(normalized);
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      setError(normalized.message);
      logError(err, 'PlanConfiguration.fetchPlans');
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
      features: p.features,
      sortOrder: p.sortOrder,
      status: p.status,
    }));
  }, [plans]);

  const handleExport = useCallback(async (config: ExportConfig) => {
    const rawData = buildExportRows();
    if (rawData.length === 0) {
      showAlert('warning', 'No plans available to export.');
      return;
    }
    const abort = new AbortController();
    exportAbort.current = abort;
    setExporting(true);
    setExportProgress(undefined);

    const result = await exportService.export(
      rawData,
      config,
      user?.id ?? 'anonymous',
      (p) => setExportProgress(p),
      abort.signal,
    );

    setExporting(false);
    setExportProgress(undefined);
    exportAbort.current = null;

    if (result.status === 'success') {
      showAlert('success', `Exported ${result.metadata.recordCount} plans as ${result.filename}`);
      setExportOpen(false);
    } else if (result.status === 'cancelled') {
      showAlert('info', result.reason);
    } else {
      showAlert('error', result.error);
    }
  }, [buildExportRows, user?.id, showAlert]);

  const handleExportPreview = useCallback(async (config: ExportConfig) => {
    const rawData = buildExportRows();
    if (rawData.length === 0) return undefined;
    return exportService.preview(rawData, config, user?.id ?? 'anonymous');
  }, [buildExportRows, user?.id]);

  const handleCancelExport = useCallback(() => {
    exportAbort.current?.abort();
  }, []);

  // Start editing a plan — populate ALL patchable fields
  const startEdit = (plan: SubscriptionType) => {
    setEditingPlan(plan.plan);
    setEditFields({
      displayName: plan.displayName,
      description: plan.description ?? '',
      billingModel: plan.billingModel,
      baseCost: plan.baseCost,
      pricePerSeat: plan.pricePerSeat,
      maxSeats: plan.maxSeats,
      maxCatalogItems: plan.maxCatalogItems,
      features: [...plan.features],
      sortOrder: plan.sortOrder,
      stripePriceIdBase: plan.stripePriceIdBase ?? '',
      stripePriceIdSeat: plan.stripePriceIdSeat ?? '',
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
        features: editFields.features,
        sortOrder: editFields.sortOrder,
        stripePriceIdBase: editFields.stripePriceIdBase || undefined,
        stripePriceIdSeat: editFields.stripePriceIdSeat || undefined,
        status: editFields.status,
      });
      setEditingPlan(null);
      setEditFields({});
      showAlert('success', 'Plan updated successfully.');
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, 'PlanConfiguration.saveEdit');
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
      showWarning('Please fill in all required fields.');
      return;
    }

    try {
      setCreating(true);
      await createSubscriptionType({
        plan: createFields.plan,
        displayName: createFields.displayName,
        description: createFields.description,
        billingModel: createFields.billingModel as BillingModel,
        baseCost: createFields.baseCost ?? 0,
        pricePerSeat: createFields.pricePerSeat ?? 0,
        maxSeats: createFields.maxSeats ?? -1,
        maxCatalogItems: createFields.maxCatalogItems ?? -1,
        features: createFields.features ?? [],
        sortOrder: createFields.sortOrder ?? 0,
        stripePriceIdBase: createFields.stripePriceIdBase || undefined,
        stripePriceIdSeat: createFields.stripePriceIdSeat || undefined,
        status: createFields.status,
      });

      setShowCreateForm(false);
      setCreateFields(DEFAULT_CREATE_STATE);
      setCreateErrors({});
      showAlert('success', `Plan "${createFields.displayName}" created.`);
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, 'PlanConfiguration.handleCreate');
    } finally {
      setCreating(false);
    }
  };

  // Cancel create
  const cancelCreate = () => {
    setShowCreateForm(false);
    setCreateFields(DEFAULT_CREATE_STATE);
    setCreateErrors({});
  };

  // Confirm and delete plan
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteSubscriptionType(deleteConfirm.plan);
      setDeleteConfirm(null);
      showAlert('success', `Plan "${deleteConfirm.displayName}" deactivated.`);
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      showError(normalized.message);
      logError(err, 'PlanConfiguration.handleDelete');
    }
  };

  // Render loading state
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading subscription plans…" />;
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
          <h1 className="text-3xl font-bold text-white">Plan Configuration</h1>
          <p className="text-gray-400 mt-1">Manage subscription plans, pricing, and features</p>
        </div>
        <EmptyState
          icon={Package}
          title="No subscription plans"
          description="Get started by creating your first subscription plan for organizations."
          action={{ label: 'Create Plan', onClick: () => setShowCreateForm(true) }}
        />
      </div>
    );
  }

  // ─── Shared options ──────────────────────────────────────────────────────
  const billingModelOptions = [
    { value: 'dynamic', label: 'Dynamic (per-seat pricing)' },
    { value: 'fixed',   label: 'Fixed (flat rate)' },
  ];
  const statusOptions: { value: SubscriptionStatus; label: string }[] = [
    { value: 'active',     label: 'Active' },
    { value: 'inactive',   label: 'Inactive' },
    { value: 'deprecated', label: 'Deprecated' },
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
        allowedFormats={['xlsx']}
        exporting={exporting}
        progress={exportProgress}
        onCancel={handleCancelExport}
      />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Plan Configuration</h1>
          <p className="text-gray-400 mt-1">Manage subscription plans, pricing, and features</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExportOpen(true)}
            className="export-btn flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-[#FFD700] text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-yellow-300 transition"
            >
              <Plus size={18} />
              Create Plan
            </button>
          )}
        </div>
      </div>

      {/* ── Create Form ──────────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="bg-[#121212] border border-[#FFD700] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-5">Create New Plan</h2>

          {/* Row 1 – identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Field label="Plan ID" required hint="lowercase, alphanumeric, underscores" error={createErrors.plan}>
              <TextInput
                value={createFields.plan ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, plan: e.target.value.toLowerCase() }))}
                placeholder="e.g., premium_pro"
              />
            </Field>

            <Field label="Display Name" required error={createErrors.displayName}>
              <TextInput
                value={createFields.displayName ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g., Premium Pro"
              />
            </Field>

            <Field label="Billing Model" required error={createErrors.billingModel}>
              <SelectInput
                options={billingModelOptions}
                value={createFields.billingModel ?? 'dynamic'}
                onChange={(e) => setCreateFields(f => ({ ...f, billingModel: e.target.value as BillingModel }))}
              />
            </Field>
          </div>

          {/* Row 2 – pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Field label="Base Cost" hint="cents" required error={createErrors.baseCost}>
              <NumberInput
                min={0}
                value={createFields.baseCost ?? 0}
                onChange={(e) => setCreateFields(f => ({ ...f, baseCost: Number(e.target.value) }))}
              />
            </Field>

            <Field label="Price Per Seat" hint="cents" error={createErrors.pricePerSeat}>
              <NumberInput
                min={0}
                value={createFields.pricePerSeat ?? 0}
                onChange={(e) => setCreateFields(f => ({ ...f, pricePerSeat: Number(e.target.value) }))}
              />
            </Field>

            <Field label="Max Seats" hint="-1 = unlimited" error={createErrors.maxSeats}>
              <NumberInput
                value={createFields.maxSeats ?? -1}
                onChange={(e) => setCreateFields(f => ({ ...f, maxSeats: Number(e.target.value) }))}
              />
            </Field>

            <Field label="Max Catalog Items" hint="-1 = unlimited" error={createErrors.maxCatalogItems}>
              <NumberInput
                value={createFields.maxCatalogItems ?? -1}
                onChange={(e) => setCreateFields(f => ({ ...f, maxCatalogItems: Number(e.target.value) }))}
              />
            </Field>
          </div>

          {/* Row 3 – meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Field label="Sort Order" error={createErrors.sortOrder}>
              <NumberInput
                value={createFields.sortOrder ?? 0}
                onChange={(e) => setCreateFields(f => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </Field>

            <Field label="Status">
              <SelectInput
                options={statusOptions}
                value={createFields.status ?? 'active'}
                onChange={(e) => setCreateFields(f => ({ ...f, status: e.target.value as SubscriptionStatus }))}
              />
            </Field>

            <Field label="Stripe Base Price ID">
              <TextInput
                value={createFields.stripePriceIdBase ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, stripePriceIdBase: e.target.value }))}
                placeholder="price_…"
              />
            </Field>

            <Field label="Stripe Seat Price ID">
              <TextInput
                value={createFields.stripePriceIdSeat ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, stripePriceIdSeat: e.target.value }))}
                placeholder="price_…"
              />
            </Field>
          </div>

          {/* Description */}
          <div className="mb-4">
            <Field label="Description" hint="max 500 chars" error={createErrors.description}>
              <TextareaInput
                value={createFields.description ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, description: e.target.value }))}
                rows={2}
                maxLength={500}
                placeholder="Brief description of this plan…"
              />
            </Field>
          </div>

          {/* Features */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-400 mb-1.5">Features</label>
            <FeaturesEditor
              features={createFields.features ?? []}
              onChange={(features) => setCreateFields(f => ({ ...f, features }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#333]">
            <button
              onClick={cancelCreate}
              disabled={creating}
              className="px-5 py-2.5 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] hover:text-white transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {creating ? 'Creating…' : <><Plus size={16} /> Create Plan</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Plan Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
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
                    <Field label="Display Name" required error={validationErrors.displayName}>
                      <TextInput
                        value={editFields.displayName ?? ''}
                        onChange={(e) => setEditFields(f => ({ ...f, displayName: e.target.value }))}
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
                      title="Save"
                    >
                      {saving ? <span className="text-xs">…</span> : <Check size={15} />}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="w-8 h-8 rounded-lg bg-red-900/30 hover:bg-red-900/50 flex items-center justify-center text-red-400 transition"
                      title="Cancel"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(plan)}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-[#FFD700] transition"
                      title="Edit plan"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ plan: plan.plan, displayName: plan.displayName })}
                      className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 flex items-center justify-center text-red-400 transition"
                      title="Deactivate plan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Pricing ─────────────────────────────────────── */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Base Cost" hint="¢" error={validationErrors.baseCost}>
                    <NumberInput
                      min={0}
                      value={editFields.baseCost ?? 0}
                      onChange={(e) => setEditFields(f => ({ ...f, baseCost: Number(e.target.value) }))}
                    />
                  </Field>
                  <Field label="Price / Seat" hint="¢" error={validationErrors.pricePerSeat}>
                    <NumberInput
                      min={0}
                      value={editFields.pricePerSeat ?? 0}
                      onChange={(e) => setEditFields(f => ({ ...f, pricePerSeat: Number(e.target.value) }))}
                    />
                  </Field>
                </div>
              ) : (
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-extrabold text-white">
                    ${formatDollars(plan.baseCost)}
                  </span>
                  <span className="text-gray-500 text-xs">/month</span>
                  {plan.pricePerSeat > 0 && (
                    <span className="text-gray-500 text-xs ml-1">
                      +${formatDollars(plan.pricePerSeat)}/seat
                    </span>
                  )}
                </div>
              )}

              {/* Status badge (read-only) or selector (edit) */}
              {isEditing ? (
                <div className="mb-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Field label="Status">
                        <SelectInput
                          options={statusOptions}
                          value={editFields.status ?? 'active'}
                          onChange={(e) => setEditFields(f => ({ ...f, status: e.target.value as SubscriptionStatus }))}
                        />
                      </Field>
                    </div>
                    <div className="flex-1">
                      <Field label="Billing Model" error={validationErrors.billingModel}>
                        <SelectInput
                          options={billingModelOptions}
                          value={editFields.billingModel ?? 'dynamic'}
                          onChange={(e) => setEditFields(f => ({ ...f, billingModel: e.target.value as BillingModel }))}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    plan.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : plan.status === 'deprecated'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-600/20 text-gray-400'
                  }`}>
                    {plan.status}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{plan.billingModel}</span>
                </div>
              )}

              <hr className="border-[#333] my-3" />

              {/* ── Limits ──────────────────────────────────────── */}
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Max Seats" hint="-1 = ∞" error={validationErrors.maxSeats}>
                    <NumberInput
                      value={editFields.maxSeats ?? -1}
                      onChange={(e) => setEditFields(f => ({ ...f, maxSeats: Number(e.target.value) }))}
                    />
                  </Field>
                  <Field label="Max Catalog Items" hint="-1 = ∞" error={validationErrors.maxCatalogItems}>
                    <NumberInput
                      value={editFields.maxCatalogItems ?? -1}
                      onChange={(e) => setEditFields(f => ({ ...f, maxCatalogItems: Number(e.target.value) }))}
                    />
                  </Field>
                  <Field label="Sort Order" error={validationErrors.sortOrder}>
                    <NumberInput
                      value={editFields.sortOrder ?? 0}
                      onChange={(e) => setEditFields(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    />
                  </Field>
                </div>
              ) : (
                <div className="text-xs text-gray-500 grid grid-cols-2 gap-1 mb-3">
                  <p>Seats: <span className="text-white">{plan.maxSeats === -1 ? '∞' : plan.maxSeats}</span></p>
                  <p>Items: <span className="text-white">{plan.maxCatalogItems === -1 ? '∞' : plan.maxCatalogItems}</span></p>
                  <p>Sort: <span className="text-white">{plan.sortOrder}</span></p>
                </div>
              )}

              {/* ── Description ─────────────────────────────────── */}
              {isEditing ? (
                <div className="mb-3">
                  <Field label="Description" hint="max 500 chars" error={validationErrors.description}>
                    <TextareaInput
                      value={editFields.description ?? ''}
                      onChange={(e) => setEditFields(f => ({ ...f, description: e.target.value }))}
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</label>
                    <FeaturesEditor
                      features={editFields.features ?? []}
                      onChange={(features) => setEditFields(f => ({ ...f, features }))}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Features</p>
                    {plan.features.length === 0 ? (
                      <p className="text-xs text-gray-600 italic">No features listed</p>
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
                  <Field label="Stripe Base Price ID">
                    <TextInput
                      value={editFields.stripePriceIdBase ?? ''}
                      onChange={(e) => setEditFields(f => ({ ...f, stripePriceIdBase: e.target.value }))}
                      placeholder="price_…"
                    />
                  </Field>
                  <Field label="Stripe Seat Price ID">
                    <TextInput
                      value={editFields.stripePriceIdSeat ?? ''}
                      onChange={(e) => setEditFields(f => ({ ...f, stripePriceIdSeat: e.target.value }))}
                      placeholder="price_…"
                    />
                  </Field>
                </div>
              )}

              {/* ── Read-only Stripe IDs ─────────────────────────── */}
              {!isEditing && (plan.stripePriceIdBase || plan.stripePriceIdSeat) && (
                <div className="text-xs text-gray-600 space-y-0.5 mb-3">
                  {plan.stripePriceIdBase && <p>Base ID: <span className="font-mono">{plan.stripePriceIdBase}</span></p>}
                  {plan.stripePriceIdSeat && <p>Seat ID: <span className="font-mono">{plan.stripePriceIdSeat}</span></p>}
                </div>
              )}

              {/* ── Cost Calculator (view mode only) ────────────── */}
              {!isEditing && <CostCalculator planId={plan.plan} />}
            </div>
          );
        })}
      </div>

      {/* ── Delete Confirmation ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { void handleDelete(); }}
        title="Deactivate Plan"
        message={`Are you sure you want to deactivate the "${deleteConfirm?.displayName}" plan? It will no longer be visible to new customers, but existing subscriptions will not be affected.`}
        confirmText="Deactivate"
        variant="danger"
      />

      {/* Alert Modal */}
      <AlertModal />
    </div>
  );
}
