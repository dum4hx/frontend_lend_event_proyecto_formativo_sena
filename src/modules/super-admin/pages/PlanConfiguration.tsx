import { useEffect, useState, useCallback, useRef } from "react";
import { Pencil, Check, X, Plus, Trash2, Package, Download } from "lucide-react";
import {
  getSubscriptionTypes,
  createSubscriptionType,
  updateSubscriptionType,
  deleteSubscriptionType,
} from "../../../services/subscriptionTypeService";
import { LoadingSpinner, ErrorDisplay, ConfirmDialog, EmptyState, AlertContainer } from "../../../components/ui";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useAuth } from "../../../contexts/useAuth";
import { useAlerts } from "../../../hooks/useAlerts";
import { ExportSettingsModal } from "../../../components/export/ExportSettingsModal";
import { exportService, PLAN_CONFIGURATION_POLICY } from "../../../services/export";
import type { ExportConfig, ExportProgress } from "../../../types/export";
import type { SubscriptionType, CreateSubscriptionTypePayload, BillingModel } from "../../../types/api";

// --- Validation helpers ----------------------------------------------------

interface PlanValidationErrors {
  plan?: string;
  displayName?: string;
  description?: string;
  baseCost?: string;
  pricePerSeat?: string;
  maxSeats?: string;
  maxCatalogItems?: string;
  billingModel?: string;
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
};

// ---------------------------------------------------------------------------

export default function PlanConfiguration() {
  const [plans, setPlans] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  
  // Edit mode
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<SubscriptionType>>({});
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

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getSubscriptionTypes();
      console.log("API RESPONSE:", res.data);
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

  // Start editing a plan
  const startEdit = (plan: SubscriptionType) => {
    setEditingPlan(plan.plan);
    setEditFields({
      displayName: plan.displayName,
      baseCost: plan.baseCost,
      pricePerSeat: plan.pricePerSeat,
      maxSeats: plan.maxSeats,
      maxCatalogItems: plan.maxCatalogItems,
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
        baseCost: editFields.baseCost,
        pricePerSeat: editFields.pricePerSeat,
        maxSeats: editFields.maxSeats,
        maxCatalogItems: editFields.maxCatalogItems,
      });
      setEditingPlan(null);
      setEditFields({});
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      alert(normalized.message);
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

    // Ensure required fields are present
    if (!createFields.plan || !createFields.displayName || !createFields.billingModel) {
      alert('Please fill in all required fields.');
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
        status: createFields.status,
      });

      // Reset form and refresh
      setShowCreateForm(false);
      setCreateFields(DEFAULT_CREATE_STATE);
      setCreateErrors({});
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      alert(normalized.message);
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
      await fetchPlans();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      alert(normalized.message);
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

      {/* Header */}
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

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-[#121212] border border-[#FFD700] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Create New Plan</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Plan identifier */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Plan ID * <span className="text-xs font-normal">(lowercase, alphanumeric, underscores)</span>
              </label>
              <input
                value={createFields.plan ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, plan: e.target.value.toLowerCase() }))}
                placeholder="e.g., premium_pro"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
              {createErrors.plan && <p className="text-red-400 text-xs mt-1">{createErrors.plan}</p>}
            </div>

            {/* Display name */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Display Name *</label>
              <input
                value={createFields.displayName ?? ''}
                onChange={(e) => setCreateFields(f => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g., Premium Pro"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
              {createErrors.displayName && <p className="text-red-400 text-xs mt-1">{createErrors.displayName}</p>}
            </div>

            {/* Billing model */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Billing Model *</label>
              <select
                value={createFields.billingModel ?? 'dynamic'}
                onChange={(e) => setCreateFields(f => ({ ...f, billingModel: e.target.value as BillingModel }))}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              >
                <option value="dynamic">Dynamic (per-seat pricing)</option>
                <option value="fixed">Fixed (flat rate)</option>
              </select>
            </div>

            {/* Base cost */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Base Cost (cents) *
              </label>
              <input
                type="number"
                min={0}
                value={createFields.baseCost ?? 0}
                onChange={(e) => setCreateFields(f => ({ ...f, baseCost: Number(e.target.value) }))}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
              {createErrors.baseCost && <p className="text-red-400 text-xs mt-1">{createErrors.baseCost}</p>}
            </div>

            {/* Price per seat */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Price Per Seat (cents)
              </label>
              <input
                type="number"
                min={0}
                value={createFields.pricePerSeat ?? 0}
                onChange={(e) => setCreateFields(f => ({ ...f, pricePerSeat: Number(e.target.value) }))}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
            </div>

            {/* Max seats */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Max Seats <span className="text-xs font-normal">(-1 = unlimited)</span>
              </label>
              <input
                type="number"
                value={createFields.maxSeats ?? -1}
                onChange={(e) => setCreateFields(f => ({ ...f, maxSeats: Number(e.target.value) }))}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
            </div>

            {/* Max catalog items */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Max Catalog Items <span className="text-xs font-normal">(-1 = unlimited)</span>
              </label>
              <input
                type="number"
                value={createFields.maxCatalogItems ?? -1}
                onChange={(e) => setCreateFields(f => ({ ...f, maxCatalogItems: Number(e.target.value) }))}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
            </div>

            {/* Sort order */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Sort Order
              </label>
              <input
                type="number"
                value={createFields.sortOrder ?? 0}
                onChange={(e) => setCreateFields(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-400 mb-2">Description</label>
            <textarea
              value={createFields.description ?? ''}
              onChange={(e) => setCreateFields(f => ({ ...f, description: e.target.value }))}
              rows={2}
              maxLength={500}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-2.5 text-white focus:border-[#FFD700] outline-none resize-none"
              placeholder="Brief description of this plan..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={cancelCreate}
              disabled={creating}
              className="px-5 py-2.5 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] hover:text-white transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2.5 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isEditing = editingPlan === plan.plan;
          const border = CARD_BORDER[plan.plan] ?? "border-[#333]";

          return (
            <div
              key={plan.plan}
              className={`bg-[#121212] border ${border} rounded-xl p-6 flex flex-col transition hover:border-[#FFD700]`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div>
                        <input
                          value={editFields.displayName ?? ""}
                          onChange={(e) =>
                            setEditFields((f) => ({
                              ...f,
                              displayName: e.target.value,
                            }))
                          }
                          maxLength={100}
                          className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-1 text-white text-sm focus:border-[#FFD700] outline-none w-full"
                        />
                        {validationErrors.displayName && (
                          <p className="text-red-400 text-xs mt-1">
                            {validationErrors.displayName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <h3 className="text-xl font-bold text-white">{plan.displayName}</h3>
                    )}
                  </div>
                </div>

                {/* Edit / Save / Cancel buttons */}
                {isEditing ? (
                  <div className="flex gap-1">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="w-8 h-8 rounded-lg bg-green-900/30 hover:bg-green-900/50 flex items-center justify-center text-green-400 transition disabled:opacity-50"
                      title="Save changes"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="w-8 h-8 rounded-lg bg-red-900/30 hover:bg-red-900/50 flex items-center justify-center text-red-400 transition"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(plan)}
                      className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#333] flex items-center justify-center text-gray-400 hover:text-[#FFD700] transition"
                      title="Edit plan"
                    >
                      <Pencil size={16} />
                    </button>
                    {plan.status === 'active' && (
                      <button
                        onClick={() => setDeleteConfirm({ plan: plan.plan, displayName: plan.displayName })}
                        className="w-8 h-8 rounded-lg bg-red-900/20 hover:bg-red-900/40 flex items-center justify-center text-red-400 transition"
                        title="Deactivate plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mb-1">
                {isEditing ? (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-gray-400">$</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min={0}
                        value={editFields.baseCost ?? 0}
                        onChange={(e) =>
                          setEditFields((f) => ({
                            ...f,
                            baseCost: Number(e.target.value),
                          }))
                        }
                        className="bg-[#1a1a1a] border border-[#444] rounded px-2 py-1 text-white text-lg font-bold w-32 focus:border-[#FFD700] outline-none"
                      />
                      {validationErrors.baseCost && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.baseCost}</p>
                      )}
                    </div>
                    <span className="text-gray-500 text-sm">/month (cents)</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      ${formatDollars(plan.baseCost)}
                    </span>
                    <span className="text-gray-500 text-sm">/month</span>
                  </div>
                )}

                {/* Status badge */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${
                    plan.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : plan.status === "deprecated"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-600/20 text-gray-400"
                  }`}
                >
                  {plan.status}
                </span>
              </div>

              {/* Divider */}
              <hr className="border-[#333] my-4" />

              {/* Features */}
              <div className="flex-1 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Features Included
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span className="text-gray-300">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limits */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Max seats:{" "}
                  <span className="text-white">
                    {plan.maxSeats === -1 ? "Unlimited" : plan.maxSeats}
                  </span>
                </p>
                <p>
                  Max catalog items:{" "}
                  <span className="text-white">
                    {plan.maxCatalogItems === -1 ? "Unlimited" : plan.maxCatalogItems}
                  </span>
                </p>
                <p>
                  Price per seat:{" "}
                  <span className="text-white">${formatDollars(plan.pricePerSeat)}</span>
                </p>
                <p>
                  Billing: <span className="text-white capitalize">{plan.billingModel}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Deactivate Plan"
        message={`Are you sure you want to deactivate the "${deleteConfirm?.displayName}" plan? It will no longer be visible to new customers, but existing subscriptions will not be affected.`}
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}
