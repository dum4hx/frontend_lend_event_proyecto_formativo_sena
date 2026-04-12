import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, ChevronDown, DollarSign, Calculator, Loader2, Trash2, RefreshCw } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { Button, PageHeader, IconButton } from "../../../../components/ui";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import Unauthorized from "../../../../pages/Unauthorized";
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
import { useCurrencyInput } from "../../../../hooks/useCurrencyInput";
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
  const { t, language } = useLanguage();
  const { guard, isAllowed } = useActionPermission(language === "es" ? "es" : "en");

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

  // ── Currency input hooks ──────────────────────────────────────────────
  const overridePricePerDay = useCurrencyInput(
    form.overridePricePerDay ? parseFloat(form.overridePricePerDay) : "",
    (val) => setForm((f) => ({ ...f, overridePricePerDay: String(val) })),
  );

  const weeklyPrice = useCurrencyInput(
    form.weeklyPrice ? parseFloat(form.weeklyPrice) : "",
    (val) => setForm((f) => ({ ...f, weeklyPrice: String(val) })),
  );

  const monthlyPrice = useCurrencyInput(
    form.monthlyPrice ? parseFloat(form.monthlyPrice) : "",
    (val) => setForm((f) => ({ ...f, monthlyPrice: String(val) })),
  );

  const flatPrice = useCurrencyInput(form.flatPrice ? parseFloat(form.flatPrice) : "", (val) =>
    setForm((f) => ({ ...f, flatPrice: String(val) })),
  );

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
      const message = error instanceof Error ? error.message : t("pricing.error.failedLoad");
      showError(message, t("pricing.error.loadError"));
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

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
      if (!configId) throw new Error(t("pricing.error.missingId"));

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
        if (!configId) throw new Error(t("pricing.error.missingIdForUpdate"));

        const payload: UpdatePricingConfigPayload = buildPayload(
          form,
        ) as UpdatePricingConfigPayload;
        await updatePricingConfig(configId, payload);
        showSuccess(t("pricing.success.updated"));
      } else {
        const payload = {
          scope: form.scope,
          referenceId: form.referenceId,
          ...buildPayload(form),
        } as CreatePricingConfigPayload;
        await createPricingConfig(payload);
        showSuccess(t("pricing.success.created"));
      }
      setShowFormModal(false);
      setEditingConfig(null);
      await fetchConfigs();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("pricing.error.failedSave");
      showError(message, t("pricing.error.saveError"));
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
      showSuccess(t("pricing.success.deleted"));
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchConfigs();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("pricing.error.failedDelete");
      showError(message, t("pricing.error.deleteError"));
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
      const message = error instanceof Error ? error.message : t("pricing.error.failedPreview");
      showError(message, t("pricing.error.previewError"));
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

  if (!hasPermission("pricing:read")) return <Unauthorized />;

  return (
    <div className="page-container">
      <div data-help-id="pricing-header">
        <PageHeader
          title={t("pricing.title")}
          subtitle={t("pricing.description")}
          actions={
            <div className="flex gap-3" data-help-id="pricing-actions">
              <IconButton
                icon={RefreshCw}
                onClick={() => void fetchConfigs()}
                disabled={loading}
                ariaLabel={t("common.refresh")}
                className={loading ? "animate-spin" : ""}
                title={t("common.refresh")}
              />
              {canPreview && (
                <Button
                  leftIcon={Calculator}
                  variant="secondary"
                  onClick={guard("pricing:read", () => {
                    setPreviewResult(null);
                    setPreviewForm(EMPTY_PREVIEW_FORM);
                    setShowPreviewModal(true);
                  })}
                  aria-disabled={!isAllowed("pricing:read")}
                  className={!isAllowed("pricing:read") ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {t("pricing.previewButton")}
                </Button>
              )}
              {canCreate && (
                <Button
                  leftIcon={Plus}
                  onClick={guard("pricing:manage", handleOpenCreate)}
                  aria-disabled={!isAllowed("pricing:manage")}
                  className={`gold-action-btn ${!isAllowed("pricing:manage") ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {t("pricing.createButton")}
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap" data-help-id="pricing-filters">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder={t("pricing.searchPlaceholder")}
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
            <option value="all">{t("pricing.allScopes")}</option>
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
            <option value="all">{t("pricing.allStrategies")}</option>
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
      <div data-help-id="pricing-table">
        <PricingConfigsTable
          configs={filtered}
          loading={loading}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────────────── */}
      {showFormModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setShowFormModal(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8"
            data-help-id={editingConfig ? "pricing-form-edit" : "pricing-form-create"}
          >
            <div className="flex items-center gap-3">
              <DollarSign size={22} className="text-[#FFD700]" />
              <h2 className="text-xl font-semibold text-white">
                {editingConfig ? t("pricing.edit.title") : t("pricing.create.title")}
              </h2>
            </div>

            {/* Scope — only on create */}
            {!editingConfig && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t("pricing.form.scope")}
                </label>
                <select
                  data-help-id="pricing-form-scope"
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
              <div className="space-y-2" data-help-id="pricing-form-reference">
                <label className="block text-sm text-gray-400">
                  {form.scope === "materialType"
                    ? t("pricing.form.materialType")
                    : t("pricing.form.package")}
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder={
                      form.scope === "materialType"
                        ? t("pricing.form.searchMaterials")
                        : t("pricing.form.searchPackages")
                    }
                    value={formItemSearch}
                    onChange={(e) => setFormItemSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all text-sm"
                  />
                </div>
                {formItemsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                    <Loader2 className="animate-spin" size={14} />
                    {t("pricing.loading")}
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
                      {form.scope === "materialType"
                        ? t("pricing.form.selectMaterial")
                        : t("pricing.form.selectPackage")}
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
              <label className="block text-sm text-gray-400 mb-1">
                {t("pricing.form.strategyType")}
              </label>
              <select
                data-help-id="pricing-form-strategy"
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
                  {t("pricing.form.overridePrice")}{" "}
                  <span className="text-gray-600 text-xs">
                    ({t("pricing.form.overridePriceHint")})
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={overridePricePerDay.displayValue}
                  onChange={overridePricePerDay.handleChange}
                  placeholder="0,00"
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
            )}

            {/* Weekly/Monthly Params */}
            {form.strategyType === "weekly_monthly" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {t("pricing.form.weeklyPrice")}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weeklyPrice.displayValue}
                    onChange={weeklyPrice.handleChange}
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {t("pricing.form.weeklyThreshold")}
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
                  <label className="block text-sm text-gray-400 mb-1">
                    {t("pricing.form.monthlyPrice")}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={monthlyPrice.displayValue}
                    onChange={monthlyPrice.handleChange}
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {t("pricing.form.monthlyThreshold")}
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
                <label className="block text-sm text-gray-400 mb-1">
                  {t("pricing.form.flatPrice")}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={flatPrice.displayValue}
                  onChange={flatPrice.handleChange}
                  placeholder="0,00"
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
                data-help-id="pricing-form-cancel"
              >
                {t("pricing.form.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="gold-action-btn"
                data-help-id="pricing-form-submit"
              >
                {submitting
                  ? t("pricing.form.saving")
                  : editingConfig
                    ? t("pricing.edit.submit")
                    : t("pricing.create.submit")}
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
            <h2 className="text-xl font-semibold text-white">{t("pricing.delete.title")}</h2>
            <p className="text-zinc-400 text-sm">
              {t("pricing.delete.confirm")
                .replace("{scope}", SCOPE_LABELS[deleteTarget.scope])
                .replace("{strategy}", STRATEGY_LABELS[deleteTarget.strategyType])}
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
                {t("pricing.form.cancel")}
              </Button>
              <Button
                leftIcon={Trash2}
                onClick={handleDeleteConfig}
                disabled={submitting}
                className="bg-red-500 hover:bg-red-600 text-white border-transparent"
              >
                {submitting ? t("pricing.delete.deleting") : t("pricing.delete.submit")}
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
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4"
            data-help-id="pricing-preview-form"
          >
            <div className="flex items-center gap-3">
              <Calculator size={22} className="text-[#FFD700]" />
              <h2 className="text-xl font-semibold text-white">{t("pricing.preview.title")}</h2>
            </div>
            <p className="text-zinc-400 text-sm">{t("pricing.preview.description")}</p>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                {t("pricing.preview.itemType")}
              </label>
              <select
                data-help-id="pricing-preview-item-type"
                value={previewForm.itemType}
                onChange={(e) =>
                  setPreviewForm((f) => ({
                    ...f,
                    itemType: e.target.value as "material" | "package",
                  }))
                }
                className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
              >
                <option value="material">{t("pricing.form.materialType")}</option>
                <option value="package">{t("pricing.form.package")}</option>
              </select>
            </div>

            <div className="space-y-2" data-help-id="pricing-preview-reference">
              <label className="block text-sm text-gray-400">
                {previewForm.itemType === "material"
                  ? t("pricing.form.materialType")
                  : t("pricing.form.package")}
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  size={16}
                />
                <input
                  type="text"
                  placeholder={
                    previewForm.itemType === "material"
                      ? t("pricing.form.searchMaterials")
                      : t("pricing.form.searchPackages")
                  }
                  value={previewItemSearch}
                  onChange={(e) => setPreviewItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all text-sm"
                />
              </div>
              {previewItemsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
                  <Loader2 className="animate-spin" size={14} />
                  {t("pricing.loading")}
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
                    {previewForm.itemType === "material"
                      ? t("pricing.form.selectMaterial")
                      : t("pricing.form.selectPackage")}
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
                <label className="block text-sm text-gray-400 mb-1">
                  {t("pricing.preview.quantity")}
                </label>
                <input
                  type="number"
                  min="1"
                  value={previewForm.quantity}
                  onChange={(e) => setPreviewForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD700] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  {t("pricing.preview.duration")}
                </label>
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
                  {t("pricing.preview.result")}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t("pricing.preview.strategy")}</span>
                  <span className="text-white">{STRATEGY_LABELS[previewResult.strategyType]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{t("pricing.preview.unitPrice")}</span>
                  <span className="text-white">${previewResult.unitPrice?.toFixed(2) ?? "—"}</span>
                </div>
                {previewResult.effectivePricePerDay != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("pricing.preview.effectivePerDay")}</span>
                    <span className="text-white">
                      ${previewResult.effectivePricePerDay.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-[#333] pt-2 mt-1">
                  <span className="text-gray-300 font-semibold">
                    {t("pricing.preview.totalPrice")}
                  </span>
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
                data-help-id="pricing-preview-cancel"
              >
                {t("pricing.preview.close")}
              </Button>
              <Button
                leftIcon={Calculator}
                onClick={handlePreview}
                disabled={previewLoading || !previewForm.referenceId}
                className="gold-action-btn"
                data-help-id="pricing-preview-submit"
              >
                {previewLoading ? t("pricing.preview.calculating") : t("pricing.preview.calculate")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertModal />
    </div>
  );
}
