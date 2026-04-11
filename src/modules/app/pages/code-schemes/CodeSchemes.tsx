import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Hash,
  RefreshCw,
  Star,
  StarOff,
} from "lucide-react";
import { Button, PageHeader, PermissionGuardedButton, IconButton } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { getPaymentMethodStatusLabel } from "../../../../utils/statusLabels";
import { usePermissions } from "../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../hooks/useActionPermission";
import Unauthorized from "../../../../pages/Unauthorized";
import { useToast } from "../../../../hooks/useToast";
import { useConfirmModal } from "../../../../hooks/useConfirmModal";
import {
  useCodeSchemes,
  useDeleteCodeScheme,
  useSetDefaultCodeScheme,
  useUpdateCodeScheme,
} from "../../../../hooks/queries/useCodeSchemeQueries";
import {
  useMaterialTypes,
  useMaterialCategories,
} from "../../../../hooks/queries/useMaterialQueries";
import type { CodeScheme, CodeSchemeEntityType } from "../../../../types/api";
import CodeSchemeFormModal from "./CodeSchemeFormModal";

const ENTITY_TABS: CodeSchemeEntityType[] = [
  "loan",
  "loan_request",
  "invoice",
  "inspection",
  "incident",
  "maintenance_batch",
  "material_instance",
];

/**
 * CodeSchemes — CRUD management page with entity-type tabs, inline
 * active toggle, set-default row action, and search.
 */
export default function CodeSchemes() {
  const { t, language } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();
  const { guard, isAllowed } = useActionPermission(isEs ? "es" : "en");
  const { showToast } = useToast();
  const { showConfirm, ConfirmModal } = useConfirmModal();

  // Tab state
  const [activeTab, setActiveTab] = useState<CodeSchemeEntityType>("loan");

  // Query
  const { data: schemes, isLoading, isError, error, refetch } = useCodeSchemes(activeTab);

  // Material lookups for scope column (only used on material_instance tab)
  const { data: materialTypesData } = useMaterialTypes();
  const { data: categories } = useMaterialCategories();

  const typeNameById = useMemo(() => {
    const map = new Map<string, string>();
    const types = materialTypesData?.materialTypes ?? [];
    for (const mt of types) map.set(mt._id, mt.name);
    return map;
  }, [materialTypesData]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories ?? []) map.set(c._id, c.name);
    return map;
  }, [categories]);

  // Mutations
  const deleteMutation = useDeleteCodeScheme();
  const setDefaultMutation = useSetDefaultCodeScheme();
  const updateMutation = useUpdateCodeScheme();

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modal
  const [showCreate, setShowCreate] = useState(false);
  const [editingScheme, setEditingScheme] = useState<CodeScheme | null>(null);
  const isModalOpen = showCreate || editingScheme !== null;

  const filtered = (schemes ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pattern.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleDelete = async (scheme: CodeScheme) => {
    if (scheme.isDefault) {
      showToast(
        "warning",
        t("settings.codeSchemes.cannotDeleteDefault"),
        isEs ? "Aviso" : "Warning",
        { duration: 3000 },
      );
      return;
    }

    const confirmed = await showConfirm({
      title: t("settings.codeSchemes.deleteConfirmTitle"),
      message: t("settings.codeSchemes.deleteConfirmMessage").replace("{name}", scheme.name),
      confirmText: isEs ? "Eliminar" : "Delete",
      cancelText: isEs ? "Cancelar" : "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(scheme._id);
      showToast(
        "success",
        t("settings.codeSchemes.toast.deleteSuccess"),
        isEs ? "Éxito" : "Success",
        { duration: 3000 },
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : t("settings.codeSchemes.toast.error"),
        "Error",
        { duration: 4000 },
      );
    }
  };

  const handleSetDefault = async (scheme: CodeScheme) => {
    if (scheme.isDefault) return;
    try {
      await setDefaultMutation.mutateAsync(scheme._id);
      showToast(
        "success",
        t("settings.codeSchemes.toast.setDefaultSuccess"),
        isEs ? "Éxito" : "Success",
        { duration: 3000 },
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : t("settings.codeSchemes.toast.error"),
        "Error",
        { duration: 4000 },
      );
    }
  };

  const handleToggleActive = async (scheme: CodeScheme) => {
    try {
      await updateMutation.mutateAsync({
        id: scheme._id,
        payload: { isActive: !scheme.isActive },
      });
      showToast(
        "success",
        t("settings.codeSchemes.toast.updateSuccess"),
        isEs ? "Éxito" : "Success",
        { duration: 3000 },
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : t("settings.codeSchemes.toast.error"),
        "Error",
        { duration: 4000 },
      );
    }
  };

  const handleModalSaved = () => {
    setShowCreate(false);
    setEditingScheme(null);
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditingScheme(null);
  };

  const tabLabel = (et: CodeSchemeEntityType): string => {
    const map: Record<CodeSchemeEntityType, string> = {
      loan: t("settings.codeSchemes.tabLoan"),
      loan_request: t("settings.codeSchemes.tabLoanRequest"),
      invoice: t("settings.codeSchemes.tabInvoice"),
      inspection: t("settings.codeSchemes.tabInspection"),
      incident: t("settings.codeSchemes.tabIncident"),
      maintenance_batch: t("settings.codeSchemes.tabMaintenanceBatch"),
      material_instance: t("settings.codeSchemes.tabMaterialInstance"),
    };
    return map[et];
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (!hasPermission("code_schemes:read")) return <Unauthorized />;

  return (
    <div className="page-container">
      <div data-help-id="code-schemes-header">
        <PageHeader
          title={isEs ? "Esquemas de" : "Code"}
          titleAccent={isEs ? "Código" : "Schemes"}
          subtitle={t("settings.codeSchemes.description")}
          actions={
            <div className="flex items-center gap-3" data-help-id="code-schemes-actions">
              <IconButton
                icon={RefreshCw}
                onClick={() => void refetch()}
                disabled={isLoading}
                ariaLabel={isEs ? "Actualizar" : "Refresh"}
                className={isLoading ? "animate-spin" : ""}
                title={isEs ? "Actualizar" : "Refresh"}
              />
              <Button
                variant="primary"
                size="md"
                onClick={guard("code_schemes:create", () => setShowCreate(true))}
                aria-disabled={!isAllowed("code_schemes:create")}
                className={!isAllowed("code_schemes:create") ? "opacity-50 cursor-not-allowed" : ""}
              >
                <Plus size={16} className="mr-2" />
                {t("settings.codeSchemes.createScheme")}
              </Button>
            </div>
          }
        />
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 bg-[#0d0d0d] border border-[#222] rounded-xl p-1 overflow-x-auto scrollbar-thin"
        data-help-id="code-schemes-tabs"
      >
        {ENTITY_TABS.map((et) => (
          <button
            key={et}
            onClick={() => {
              setActiveTab(et);
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === et
                ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30"
                : "text-gray-400 hover:text-white border border-transparent"
            }`}
          >
            {tabLabel(et)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-full group" data-help-id="code-schemes-search">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
        <input
          type="text"
          placeholder={isEs ? "Buscar esquemas de código..." : "Search code schemes..."}
          className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error instanceof Error ? error.message : t("settings.codeSchemes.toast.error")}
        </div>
      )}

      {/* Table */}
      <div
        className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl"
        data-help-id="code-schemes-table"
      >
        {isLoading && !schemes ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Hash className="w-10 h-10 text-gray-600" />
            <p className="text-gray-500 text-sm font-medium">
              {t("settings.codeSchemes.noSchemes")}
            </p>
            <p className="text-gray-600 text-xs">
              {t("settings.codeSchemes.noSchemesDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d0d0d] border-b border-[#222]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t("settings.codeSchemes.schemeName")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t("settings.codeSchemes.pattern")}
                  </th>
                  {activeTab === "material_instance" && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("settings.codeSchemes.scope")}
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t("settings.codeSchemes.isActive")}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t("settings.codeSchemes.isDefault")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {t("settings.codeSchemes.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filtered.map((scheme) => (
                  <tr key={scheme._id} className="hover:bg-[#1a1a1a] transition-all">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-[#FFD700]" />
                        <span className="text-white font-medium text-sm">{scheme.name}</span>
                      </div>
                    </td>

                    {/* Pattern */}
                    <td className="px-6 py-4">
                      <code className="text-xs text-[#FFD700]/80 bg-[#1a1a1a] px-2 py-1 rounded font-mono">
                        {scheme.pattern}
                      </code>
                    </td>

                    {/* Scope (material_instance only) */}
                    {activeTab === "material_instance" && (
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-400">
                          {scheme.materialTypeId
                            ? `${t("settings.codeSchemes.scopeTypeName")}: ${typeNameById.get(scheme.materialTypeId) ?? scheme.materialTypeId}`
                            : scheme.categoryId
                              ? `${t("settings.codeSchemes.scopeCategoryName")}: ${categoryNameById.get(scheme.categoryId) ?? scheme.categoryId}`
                              : t("settings.codeSchemes.scopeGlobalShort")}
                        </span>
                      </td>
                    )}

                    {/* Active toggle */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={guard(
                          "code_schemes:update",
                          () => void handleToggleActive(scheme),
                        )}
                        aria-disabled={!isAllowed("code_schemes:update")}
                        disabled={updateMutation.isPending}
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${!isAllowed("code_schemes:update") ? "opacity-50 cursor-not-allowed" : ""} ${
                          scheme.isActive ? "bg-green-500" : "bg-[#333]"
                        }`}
                        title={getPaymentMethodStatusLabel(
                          scheme.isActive ? "active" : "inactive",
                          language,
                        )}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                            scheme.isActive ? "translate-x-4" : ""
                          }`}
                        />
                      </button>
                    </td>

                    {/* Default badge / set-default action */}
                    <td className="px-6 py-4 text-center">
                      {scheme.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] text-xs rounded-full font-semibold">
                          <Star size={10} />
                          {t("settings.codeSchemes.isDefault")}
                        </span>
                      ) : (
                        <PermissionGuardedButton
                          icon={StarOff}
                          ariaLabel={t("settings.codeSchemes.setDefault")}
                          intent="neutral"
                          requiredPermission="code_schemes:update"
                          onClick={() => void handleSetDefault(scheme)}
                        />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGuardedButton
                          icon={Pencil}
                          ariaLabel={t("settings.codeSchemes.editScheme")}
                          intent="edit"
                          requiredPermission="code_schemes:update"
                          onClick={() => setEditingScheme(scheme)}
                        />
                        <PermissionGuardedButton
                          icon={Trash2}
                          ariaLabel={t("settings.codeSchemes.deleteScheme")}
                          intent="delete"
                          requiredPermission="code_schemes:delete"
                          onClick={() => {
                            if (deleteMutation.isPending) return;
                            void handleDelete(scheme);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <CodeSchemeFormModal
          editingScheme={editingScheme}
          defaultEntityType={activeTab}
          onClose={closeModal}
          onSaved={handleModalSaved}
        />
      )}

      {/* Confirm modal rendered by useConfirmModal */}
      <ConfirmModal />
    </div>
  );
}
