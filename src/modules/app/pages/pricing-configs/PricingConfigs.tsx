import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, ChevronDown, DollarSign, Calculator, Loader2, Trash2 } from "lucide-react";
import { Button } from "../../../../components/ui";
import {
  getPricingConfigs,
  getPricingConfig,
  createPricingConfig,
  updatePricingConfig,
  deletePricingConfig,
  previewPricing,
} from "../../../../services/pricingService";
import { getMaterialTypes, getPackages } from "../../../../services/materialService";
import { useAlertModal } from "../../../../hooks/useAlertModal";
import { usePermissions } from "../../../../contexts/usePermissions";
import { PricingConfigsTable } from "./PricingConfigsTable";
import { configToForm, buildPayload } from "./helpers";
import { SCOPE_LABELS, STRATEGY_LABELS, EMPTY_FORM, EMPTY_PREVIEW_FORM } from "./types";
import type {
  PricingConfig,
  PricingScope,
  PricingStrategyType,
  CreatePricingConfigPayload,
  UpdatePricingConfigPayload,
  PricingPreviewParams,
  PricingPreviewResult,
  MaterialType,
  Package,
  FormState,
  PreviewFormState,
} from "./types";

/** Lightweight item shape shared by form and preview selectors. */
interface FormItem {
  _id: string;
  name: string;
}

export default function PricingConfigs() {
  const { hasPermission } = usePermissions();
  const { showError, showSuccess, AlertModal } = useAlertModal();

  // ── Data ──────────────────────────────────────────────────────────────
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Filters ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState<PricingScope | "all">("all");
  const [strategyFilter, setStrategyFilter] = useState<PricingStrategyType | "all">("all");

  // ── Form modal ────────────────────────────────────────────────────────
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<PricingConfig | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [formItemsLoading, setFormItemsLoading] = useState(false);
  const [formItemSearch, setFormItemSearch] = useState("");

  // ── Delete confirm ────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PricingConfig | null>(null);

  // ── Preview modal ────────────────────────────────────────────────────
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewForm, setPreviewForm] = useState<PreviewFormState>(EMPTY_PREVIEW_FORM);
  const [previewResult, setPreviewResult] = useState<PricingPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewItems, setPreviewItems] = useState<FormItem[]>([]);
  const [previewItemsLoading, setPreviewItemsLoading] = useState(false);
  const [previewItemSearch, setPreviewItemSearch] = useState("");

  // ── Fetch form items when scope changes ───────────────────────────────
  useEffect(() => {
    if (!showFormModal || editingConfig || form.scope === "organization") return;
    void (async () => {
      setFormItemsLoading(true);
      setFormItems([]);
      setFormItemSearch("");
      setForm((f) => ({ ...f, referenceId: "" }));
      try {
        if (form.scope === "materialType") {
          const res = await getMaterialTypes();
          setFormItems(
            (res.data.materialTypes as MaterialType[]).map((t) => ({ _id: t._id, name: t.name })),
          );
        } else {
          const res = await getPackages();
          setFormItems((res.data.packages as Package[]).map((p) => ({ _id: p._id, name: p.name })));
        }
      } catch {
        // silently fail
      } finally {
        setFormItemsLoading(false);
      }
    })();
  }, [showFormModal, form.scope, editingConfig]);

  // ── Fetch preview items when modal opens or item type changes ─────────
  useEffect(() => {
    if (!showPreviewModal) return;
    void (async () => {
      setPreviewItemsLoading(true);
      setPreviewItems([]);
      setPreviewItemSearch("");
      setPreviewForm((f) => ({ ...f, referenceId: "" }));
      try {
        if (previewForm.itemType === "material") {
          const res = await getMaterialTypes();
          setPreviewItems(
            (res.data.materialTypes as MaterialType[]).map((t) => ({ _id: t._id, name: t.name })),
          );
        } else {
          const res = await getPackages();
          setPreviewItems(
            (res.data.packages as Package[]).map((p) => ({ _id: p._id, name: p.name })),
          );
        }
      } catch {
        // silently fail
      } finally {
        setPreviewItemsLoading(false);
      }
    })();
  }, [showPreviewModal, previewForm.itemType]);

  // ── Permissions ───────────────────────────────────────────────────────
  const canCreate = hasPermission("pricing:manage");
  const canEdit = hasPermission("pricing:manage");
  const canDelete = hasPermission("pricing:manage");
  const canPreview = hasPermission("pricing:read");

  // ── Fetch configs ─────────────────────────────────────────────────────
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPricingConfigs();
      const data = res.data as unknown;
      if (Array.isArray(data)) {
        setConfigs(data);
      } else if (
        data &&
        typeof data === "object" &&
        "configs" in data &&
        Array.isArray(data.configs)
      ) {
        setConfigs(data.configs);
      } else {
        setConfigs([]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load pricing configs";
      showError(message, "Load Error");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    void fetchConfigs();
  }, [fetchConfigs]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return configs.filter((c) => {
      const matchesScope = scopeFilter === "all" || c.scope === scopeFilter;
      const matchesStrategy = strategyFilter === "all" || c.strategyType === strategyFilter;
      const matchesSearch =
        !term ||
        c._id.toLowerCase().includes(term) ||
        c.referenceId.toLowerCase().includes(term) ||
        SCOPE_LABELS[c.scope].toLowerCase().includes(term);
      return matchesScope && matchesStrategy && matchesSearch;
    });
  }, [configs, searchTerm, scopeFilter, strategyFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingConfig(null);
    setForm(EMPTY_FORM);
    setShowFormModal(true);
  };

  const handleOpenEdit = async (config: PricingConfig) => {
    try {
      const configId = config._id || (config as unknown as { id?: string }).id;
      if (!configId) throw new Error("Missing configuration ID");

      const res = await getPricingConfig(configId);
      const data = res.data as unknown as { config?: PricingConfig };
      const normalizedConfig = {
        ...config,
        ...(data?.config || (data as unknown as PricingConfig)),
      };
      setEditingConfig(normalizedConfig);
      setForm(configToForm(normalizedConfig));
    } catch {
      setEditingConfig(config);
      setForm(configToForm(config));
    }
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingConfig) {
        const configId = editingConfig._id || (editingConfig as unknown as { id?: string }).id;
        if (!configId) throw new Error("Missing ID for update");

        const payload: UpdatePricingConfigPayload = buildPayload(
          form,
        ) as UpdatePricingConfigPayload;
        await updatePricingConfig(configId, payload);
        showSuccess("Pricing configuration updated.", "Config Updated");
      } else {
        const payload = {
          scope: form.scope,
          referenceId: form.referenceId,
          ...buildPayload(form),
        } as CreatePricingConfigPayload;
        await createPricingConfig(payload);
        showSuccess("Pricing configuration created.", "Config Created");
      }
      setShowFormModal(false);
      setEditingConfig(null);
      await fetchConfigs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save pricing config";
      showError(message, "Save Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (config: PricingConfig) => {
    setDeleteTarget(config);
    setShowDeleteModal(true);
  };

  const handleDeleteConfig = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deletePricingConfig(deleteTarget._id);
      showSuccess("Pricing configuration deleted.", "Config Deleted");
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchConfigs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete pricing config";
      showError(message, "Delete Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const params: PricingPreviewParams = {
        itemType: previewForm.itemType,
        referenceId: previewForm.referenceId,
        quantity: Number(previewForm.quantity),
        durationInDays: Number(previewForm.durationInDays),
      };
      const res = await previewPricing(params);
      setPreviewResult(res.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to calculate preview";
      showError(message, "Preview Error");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Filtered form items helper ────────────────────────────────────────
  const filteredFormItems = useMemo(
    () =>
      formItems.filter(
        (item) => !formItemSearch || item.name.toLowerCase().includes(formItemSearch.toLowerCase()),
      ),
    [formItems, formItemSearch],
  );

  const filteredPreviewItems = useMemo(
    () =>
      previewItems.filter(
        (item) =>
          !previewItemSearch || item.name.toLowerCase().includes(previewItemSearch.toLowerCase()),
      ),
    [previewItems, previewItemSearch],
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pricing Configurations</h1>
          <p className="text-gray-400 mt-1">Manage pricing strategies for materials and packages</p>
        </div>
        <div className="flex gap-3">
          {canPreview && (
            <Button
              leftIcon={Calculator}
              variant="secondary"
              onClick={() => {
                setPreviewResult(null);
                setPreviewForm(EMPTY_PREVIEW_FORM);
                setShowPreviewModal(true);
              }}
            >
              Price Preview
            </Button>
          )}
          {canCreate && (
            <Button leftIcon={Plus} onClick={handleOpenCreate} className="gold-action-btn">
              New Config
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search by scope or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
          />
        </div>
        <div className="relative">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as PricingScope | "all")}
            className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
          >
            <option value="all">All Scopes</option>
            {(Object.keys(SCOPE_LABELS) as PricingScope[]).map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            size={20}
          />
        </div>
        <div className="relative">
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value as PricingStrategyType | "all")}
            className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
          >
            <option value="all">All Strategies</option>
            {(Object.keys(STRATEGY_LABELS) as PricingStrategyType[]).map((s) => (
              <option key={s} value={s}>
                {STRATEGY_LABELS[s]}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            size={20}
          />
        </div>
      </div>

      {/* Table */}
      <PricingConfigsTable
        configs={filtered}
        loading={loading}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* ── Create / Edit Modal ───────────────────────────────────────── */}
      {showFormModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setShowFormModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
            <div className="flex items-center gap-3">
              <DollarSign size={22} className="text-[#FFD700]" />
              <h2 className="text-xl font-semibold text-white">
                {editingConfig ? "Edit Pricing Config" : "New Pricing Config"}
              </h2>
            </div>

            {/* Scope — only on create */}
            {!editingConfig && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Scope</label>
                <select
                  value={form.scope}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scope: e.target.value as PricingScope }))
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
                >
                  {(Object.keys(SCOPE_LABELS) as PricingScope[]).map((s) => (
                    <option key={s} value={s}>
                      {SCOPE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reference ID — only when scope is not organization */}
            {!editingConfig && form.scope !== "organization" && (
              <div className="space-y-2">
                <label className="block text-sm text-gray-400">
                  {form.scope === "materialType" ? "Material Type" : "Package"}
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder={`Search ${form.scope === "materialType" ? "material types" : "packages"}...`}
                    value={formItemSearch}
                    onChange={(e) => setFormItemSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all text-sm"
                  />
                </div>
                {formItemsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                    <Loader2 className="animate-spin" size={14} />
                    Loading...
                  </div>
                ) : (
                  <select
                    value={form.referenceId}
                    onChange={(e) => {
                      const selectedName =
                        formItems.find((item) => item._id === e.target.value)?.name ?? "";
                      setFormItemSearch(selectedName);
                      setForm((f) => ({ ...f, referenceId: e.target.value }));
                    }}
                    size={Math.min(filteredFormItems.length, 5) || 1}
                    className="w-full px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all text-sm"
                  >
                    <option value="" disabled>
                      Select {form.scope === "materialType" ? "a material type" : "a package"}
                    </option>
                    {filteredFormItems.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Strategy */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Strategy Type</label>
              <select
                value={form.strategyType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    strategyType: e.target.value as PricingStrategyType,
                  }))
                }
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
              >
                {(Object.keys(STRATEGY_LABELS) as PricingStrategyType[]).map((s) => (
                  <option key={s} value={s}>
                    {STRATEGY_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Per Day Params */}
            {form.strategyType === "per_day" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Override price per day{" "}
                  <span className="text-gray-600 text-xs">(leave blank for default)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.overridePricePerDay}
                  onChange={(e) => setForm((f) => ({ ...f, overridePricePerDay: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
            )}

            {/* Weekly/Monthly Params */}
            {form.strategyType === "weekly_monthly" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Weekly price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.weeklyPrice}
                    onChange={(e) => setForm((f) => ({ ...f, weeklyPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Weekly threshold (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.weeklyThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, weeklyThreshold: e.target.value }))}
                    placeholder="7"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Monthly price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monthlyPrice}
                    onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Monthly threshold (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.monthlyThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, monthlyThreshold: e.target.value }))}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Fixed Params */}
            {form.strategyType === "fixed" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Flat price ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.flatPrice}
                  onChange={(e) => setForm((f) => ({ ...f, flatPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowFormModal(false);
                  setEditingConfig(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gold-action-btn">
                {submitting ? "Saving..." : editingConfig ? "Save Changes" : "Create Config"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
      {showDeleteModal && deleteTarget && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-semibold text-white">Delete Pricing Config</h2>
            <p className="text-zinc-400 text-sm">
              Delete the{" "}
              <span className="text-white font-medium">{SCOPE_LABELS[deleteTarget.scope]}</span>{" "}
              configuration with{" "}
              <span className="text-white font-medium">
                {STRATEGY_LABELS[deleteTarget.strategyType]}
              </span>{" "}
              strategy? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                leftIcon={Trash2}
                onClick={handleDeleteConfig}
                disabled={submitting}
                className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              >
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Price Preview Modal ───────────────────────────────────────── */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowPreviewModal(false)}
        >
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Calculator size={22} className="text-[#FFD700]" />
              <h2 className="text-xl font-semibold text-white">Price Preview</h2>
            </div>
            <p className="text-zinc-400 text-sm">
              Calculate an estimated price for a material type or package.
            </p>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Item Type</label>
              <select
                value={previewForm.itemType}
                onChange={(e) =>
                  setPreviewForm((f) => ({
                    ...f,
                    itemType: e.target.value as "material" | "package",
                  }))
                }
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
              >
                <option value="material">Material Type</option>
                <option value="package">Package</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-gray-400">
                {previewForm.itemType === "material" ? "Material Type" : "Package"}
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={`Search ${previewForm.itemType === "material" ? "material types" : "packages"}...`}
                  value={previewItemSearch}
                  onChange={(e) => setPreviewItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all text-sm"
                />
              </div>
              {previewItemsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                  <Loader2 className="animate-spin" size={14} />
                  Loading...
                </div>
              ) : (
                <select
                  value={previewForm.referenceId}
                  onChange={(e) => {
                    const selectedName =
                      previewItems.find((item) => item._id === e.target.value)?.name ?? "";
                    setPreviewItemSearch(selectedName);
                    setPreviewForm((f) => ({ ...f, referenceId: e.target.value }));
                  }}
                  size={Math.min(filteredPreviewItems.length, 5) || 1}
                  className="w-full px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all text-sm"
                >
                  <option value="" disabled>
                    Select {previewForm.itemType === "material" ? "a material type" : "a package"}
                  </option>
                  {filteredPreviewItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={previewForm.quantity}
                  onChange={(e) => setPreviewForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  value={previewForm.durationInDays}
                  onChange={(e) =>
                    setPreviewForm((f) => ({ ...f, durationInDays: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
            </div>

            {previewResult && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
                  Result
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Strategy</span>
                  <span className="text-white">{STRATEGY_LABELS[previewResult.strategyType]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Unit price</span>
                  <span className="text-white">${previewResult.unitPrice?.toFixed(2) ?? "—"}</span>
                </div>
                {previewResult.effectivePricePerDay != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Effective per day</span>
                    <span className="text-white">
                      ${previewResult.effectivePricePerDay.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-[#333] pt-2 mt-1">
                  <span className="text-gray-300 font-semibold">Total price</span>
                  <span className="text-[#FFD700] font-bold text-base">
                    ${previewResult.totalPrice?.toFixed(2) ?? "—"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewResult(null);
                }}
                disabled={previewLoading}
              >
                Close
              </Button>
              <Button
                leftIcon={Calculator}
                onClick={handlePreview}
                disabled={previewLoading || !previewForm.referenceId}
                className="gold-action-btn"
              >
                {previewLoading ? "Calculating..." : "Calculate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
