import React, { useCallback, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Link2, Plus, Search, X } from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useConfirmModal } from "../../../../hooks/useConfirmModal";
import { createRole, updateRole } from "../../../../services/roleService";
import { normalizeError, logError } from "../../../../utils/errorHandling";
import { validateRoleName } from "../../../../utils/validators";
import type { Role, Permission } from "../../../../types/api";
import type { TranslationKey } from "../../../../i18n/translations";

interface RoleFormModalProps {
  mode: "create" | "edit";
  role?: Role;
  permissions: Permission[];
  onClose: () => void;
  onSaved: () => void;
}

export default function RoleFormModal({
  mode,
  role,
  permissions,
  onClose,
  onSaved,
}: RoleFormModalProps) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { showConfirm, ConfirmModal } = useConfirmModal();

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    if (!role) return {};
    return Object.fromEntries(role.permissions.map((pid) => [pid, true]));
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState("");
  const [expandedDeps, setExpandedDeps] = useState<Record<string, boolean>>({});

  /** Map permission id → Permission object for fast lookup. */
  const permById = useMemo(() => new Map(permissions.map((p) => [p.id, p])), [permissions]);

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const selectedPermIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected],
  );

  /** For each selected permission with `requires`, compute which deps are missing. */
  const missingDepsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const id of selectedPermIds) {
      const perm = permById.get(id);
      if (!perm?.requires?.length) continue;
      const missing = perm.requires.filter((r) => !selected[r]);
      if (missing.length > 0) map.set(id, missing);
    }
    return map;
  }, [selectedPermIds, selected, permById]);

  const totalMissingCount = useMemo(() => missingDepsMap.size, [missingDepsMap]);

  const filteredPermissions = useMemo(
    () =>
      permissions.filter(
        (p) =>
          p.displayName.toLowerCase().includes(permSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(permSearch.toLowerCase()),
      ),
    [permissions, permSearch],
  );

  const grouped = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    filteredPermissions.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, [filteredPermissions]);

  const togglePermission = async (id: string) => {
    const isCurrentlySelected = !!selected[id];

    // Toggling OFF → no confirmation needed
    if (isCurrentlySelected) {
      setSelected((prev) => ({ ...prev, [id]: false }));
      return;
    }

    // Toggling ON → check if this permission has unsatisfied required permissions
    const perm = permById.get(id);
    const requiredIds = perm?.requires?.filter((r) => !selected[r]) ?? [];

    if (requiredIds.length === 0) {
      // No missing deps → toggle normally
      setSelected((prev) => ({ ...prev, [id]: true }));
      return;
    }

    // Build display names list for the confirmation dialog
    const requiredNames = requiredIds.map((rid) => permById.get(rid)?.displayName ?? rid);

    const confirmed = await showConfirm({
      title: t("permissions.confirmDependenciesTitle"),
      message: (
        <div className="space-y-3">
          <p>
            {t("permissions.confirmDependenciesMessage", { permission: perm?.displayName ?? id })}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
            {requiredNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="text-sm text-gray-400">{t("permissions.confirmDependenciesPrompt")}</p>
        </div>
      ),
      confirmText: t("permissions.confirmAddAll"),
      cancelText: t("common.cancel"),
      variant: "info",
    });

    if (confirmed) {
      setSelected((prev) => {
        const next = { ...prev, [id]: true };
        requiredIds.forEach((rid) => {
          next[rid] = true;
        });
        return next;
      });
    }
  };

  const toggleDepExpanded = (id: string) =>
    setExpandedDeps((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () => {
    const extra = Object.fromEntries(filteredPermissions.map((p) => [p.id, true]));
    setSelected((prev) => ({ ...prev, ...extra }));
  };

  const clearAll = () => setSelected({});

  /** Add all missing dependency permissions for a single permission. */
  const addMissingDeps = useCallback(
    (permId: string) => {
      const missing = missingDepsMap.get(permId);
      if (!missing?.length) return;
      setSelected((prev) => {
        const next = { ...prev };
        missing.forEach((m) => {
          next[m] = true;
        });
        return next;
      });
      showToast(
        "info",
        t("permissions.dependencyAdded", { count: String(missing.length) }),
        t("alert.info"),
      );
    },
    [missingDepsMap, showToast, t],
  );

  /** Add ALL missing dependencies across all selected permissions. */
  const addAllMissingDeps = useCallback(() => {
    let count = 0;
    setSelected((prev) => {
      const next = { ...prev };
      for (const [, missing] of missingDepsMap) {
        for (const m of missing) {
          if (!next[m]) {
            next[m] = true;
            count++;
          }
        }
      }
      return next;
    });
    if (count > 0) {
      showToast(
        "info",
        t("permissions.dependencyAdded", { count: String(count) }),
        t("alert.info"),
      );
    }
  }, [missingDepsMap, showToast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const nameValidation = validateRoleName(name);
    if (!nameValidation.isValid) {
      setFieldError(t(nameValidation.message as TranslationKey));
      return;
    }

    if (selectedPermIds.length === 0) {
      setFieldError(t("roles.selectAtLeastOne"));
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "create") {
        await createRole({
          name: name.trim(),
          permissions: selectedPermIds,
          description: description.trim() || undefined,
        });
        showToast("success", t("roles.roleCreated"), t("alert.success"));
      } else if (role) {
        await updateRole(role._id, {
          name: name.trim(),
          permissions: selectedPermIds,
          description: description.trim() || undefined,
        });
        showToast("success", t("roles.roleUpdated"), t("alert.success"));
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const normalized = normalizeError(err);
      logError(err, "RoleFormModal.submit");
      setFieldError(normalized.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-4 sm:p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {mode === "create"
              ? t("roles.newRole")
              : t("roles.editRole", { name: role?.name ?? "" })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-white p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-5"
          data-help-id={mode === "create" ? "roles-form-create" : "roles-form-edit"}
        >
          {/* Role name */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">
              {t("roles.roleName")} <span className="text-[#FFD700]">*</span>
            </label>
            <input
              data-help-id="roles-form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roles.roleNamePlaceholder")}
              disabled={submitting}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] outline-none disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">
              {t("roles.description")}
            </label>
            <textarea
              data-help-id="roles-form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("roles.descriptionPlaceholder")}
              rows={2}
              disabled={submitting}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Permissions */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-semibold text-gray-400">
                {t("roles.permissions")} <span className="text-[#FFD700]">*</span>
                <span className="text-xs font-normal text-gray-500 ml-2">
                  ({t("roles.permissionsSelected", { count: String(selectedCount) })})
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-gray-400 hover:text-[#FFD700] transition-colors"
                >
                  {t("roles.selectAll")}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-[#FFD700] transition-colors"
                >
                  {t("roles.clearAll")}
                </button>
              </div>
            </div>

            {/* Permission search */}
            <div className="relative mb-2" data-help-id="roles-form-permissions-search">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder={t("roles.filterPermissions")}
                className="w-full pl-8 pr-3 py-2 bg-[#0f0f0f] border border-[#222] rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#FFD700] outline-none"
              />
            </div>

            {/* Permission grid grouped by category */}
            <div
              className="max-h-72 overflow-auto bg-[#0f0f0f] rounded-lg border border-[#222] p-2 space-y-3"
              data-help-id="roles-form-permissions"
            >
              {Object.entries(grouped).map(([category, perms]) => (
                <div key={category}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 mb-1">
                    {category}
                  </p>
                  <div className="space-y-0.5">
                    {perms.map((p) => {
                      const isSelected = !!selected[p.id];
                      const hasDeps = p.requires?.length > 0;
                      const missingDeps = isSelected ? (missingDepsMap.get(p.id) ?? []) : [];
                      const hasMissing = missingDeps.length > 0;
                      const isExpanded = !!expandedDeps[p.id];

                      return (
                        <div key={p.id} className="bg-[#121212] rounded-md">
                          <div className="flex items-center gap-2 px-2 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => void togglePermission(p.id)}
                              disabled={submitting}
                              className="h-3.5 w-3.5 accent-[#FFD700] flex-shrink-0"
                            />
                            <span
                              className={`text-xs truncate flex-1 ${hasMissing ? "text-amber-300" : "text-gray-300"}`}
                              title={p.displayName}
                            >
                              {p.displayName}
                            </span>

                            {/* Dependency toggle button */}
                            {hasDeps && (
                              <button
                                type="button"
                                onClick={() => toggleDepExpanded(p.id)}
                                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors flex-shrink-0 ${
                                  hasMissing
                                    ? "text-amber-400 hover:bg-amber-400/10"
                                    : "text-gray-500 hover:bg-zinc-700/50"
                                }`}
                                title={
                                  isExpanded
                                    ? t("permissions.hideDependencies")
                                    : t("permissions.showDependencies")
                                }
                              >
                                <Link2 size={10} />
                                <span>{p.requires.length}</span>
                                {isExpanded ? (
                                  <ChevronDown size={10} />
                                ) : (
                                  <ChevronRight size={10} />
                                )}
                              </button>
                            )}

                            {/* Missing deps warning badge */}
                            {hasMissing && (
                              <span
                                className="flex items-center gap-0.5 text-[10px] text-amber-400 flex-shrink-0"
                                title={t("permissions.missingDependencies")}
                              >
                                <AlertTriangle size={10} />
                              </span>
                            )}
                          </div>

                          {/* Collapsible dependency list */}
                          {hasDeps && isExpanded && (
                            <div className="px-3 pb-2 ml-5">
                              <div className="border-l-2 border-zinc-700 pl-2 space-y-1">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                  {t("permissions.requires")}
                                </p>
                                {p.requires.map((reqId) => {
                                  const reqPerm = permById.get(reqId);
                                  const isSatisfied = !!selected[reqId];
                                  return (
                                    <div
                                      key={reqId}
                                      className="flex items-center gap-1.5 text-[11px]"
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                          isSatisfied ? "bg-green-500" : "bg-amber-400"
                                        }`}
                                      />
                                      <span
                                        className={isSatisfied ? "text-gray-400" : "text-amber-300"}
                                      >
                                        {reqPerm?.displayName ?? reqId}
                                      </span>
                                    </div>
                                  );
                                })}
                                {hasMissing && (
                                  <button
                                    type="button"
                                    onClick={() => addMissingDeps(p.id)}
                                    className="text-[10px] text-[#FFD700] hover:text-yellow-300 transition-colors mt-1"
                                  >
                                    + {t("permissions.addRequired")}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredPermissions.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">
                  {t("roles.noPermissionsMatch")}
                </p>
              )}
            </div>
          </div>

          {/* Missing dependencies warning banner */}
          {totalMissingCount > 0 && (
            <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-700/40 rounded-lg px-3 py-2.5">
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-300">
                  {t("permissions.missingDepsWarning", { count: String(totalMissingCount) })}
                </p>
                <button
                  type="button"
                  onClick={addAllMissingDeps}
                  className="text-xs text-[#FFD700] hover:text-yellow-300 font-medium mt-1 transition-colors"
                >
                  {t("permissions.addAllMissing")}
                </button>
              </div>
            </div>
          )}

          {fieldError && <p className="text-red-400 text-sm">{fieldError}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              data-help-id="roles-form-cancel"
              className="px-4 py-2 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition text-sm disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-help-id="roles-form-submit"
              className="px-5 py-2 font-semibold rounded-lg transition flex items-center gap-2 text-sm gold-action-btn disabled:opacity-50"
            >
              <Plus size={14} />
              {submitting
                ? mode === "create"
                  ? t("roles.creating")
                  : t("roles.saving")
                : mode === "create"
                  ? t("roles.createRole")
                  : t("roles.saveChanges")}
            </button>
          </div>
        </form>
      </div>
      <ConfirmModal />
    </div>
  );
}
