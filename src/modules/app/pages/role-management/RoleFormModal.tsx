import React, { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";
import { createRole, updateRole } from "../../../../services/roleService";
import { normalizeError, logError } from "../../../../utils/errorHandling";
import { validateRoleName } from "../../../../utils/validators";
import type { Role, Permission } from "../../../../types/api";

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

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    if (!role) return {};
    return Object.fromEntries(role.permissions.map((pid) => [pid, true]));
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [permSearch, setPermSearch] = useState("");

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  const selectedPermIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selected],
  );

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

  const togglePermission = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () => {
    const extra = Object.fromEntries(filteredPermissions.map((p) => [p._id, true]));
    setSelected((prev) => ({ ...prev, ...extra }));
  };

  const clearAll = () => setSelected({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const nameValidation = validateRoleName(name);
    if (!nameValidation.isValid) {
      setFieldError(nameValidation.message ?? "Invalid role name");
      return;
    }

    if (selectedPermIds.length === 0) {
      setFieldError("Select at least one permission");
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
        showToast("success", "Role created successfully", "Success");
      } else if (role) {
        await updateRole(role._id, {
          name: name.trim(),
          permissions: selectedPermIds,
          description: description.trim() || undefined,
        });
        showToast("success", "Role updated successfully", "Success");
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
            {mode === "create" ? "New Role" : `Edit Role: ${role?.name}`}
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Role name */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">
              Role name <span className="text-[#FFD700]">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. auditor"
              disabled={submitting}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] outline-none disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              disabled={submitting}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white text-sm focus:border-[#FFD700] outline-none resize-none disabled:opacity-50"
            />
          </div>

          {/* Permissions */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-sm font-semibold text-gray-400">
                Permissions <span className="text-[#FFD700]">*</span>
                <span className="text-xs font-normal text-gray-500 ml-2">
                  ({selectedCount} selected)
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-gray-400 hover:text-[#FFD700] transition-colors"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-[#FFD700] transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Permission search */}
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Filter permissions..."
                className="w-full pl-8 pr-3 py-2 bg-[#0f0f0f] border border-[#222] rounded-lg text-sm text-white placeholder-gray-600 focus:border-[#FFD700] outline-none"
              />
            </div>

            {/* Permission grid grouped by category */}
            <div className="max-h-60 overflow-auto bg-[#0f0f0f] rounded-lg border border-[#222] p-2 space-y-3">
              {Object.entries(grouped).map(([category, perms]) => (
                <div key={category}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 mb-1">
                    {category}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {perms.map((p) => (
                      <label
                        key={p._id}
                        className="flex items-center gap-2 text-xs bg-[#121212] px-2 py-2 rounded-md cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={!!selected[p._id]}
                          onChange={() => togglePermission(p._id)}
                          disabled={submitting}
                          className="h-3.5 w-3.5 accent-[#FFD700]"
                        />
                        <span className="text-gray-300 truncate" title={p.displayName}>
                          {p.displayName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {filteredPermissions.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-4">
                  No permissions match your search.
                </p>
              )}
            </div>
          </div>

          {fieldError && <p className="text-red-400 text-sm">{fieldError}</p>}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#333]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-[#333] text-gray-300 rounded-lg hover:bg-[#1a1a1a] transition text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 font-semibold rounded-lg transition flex items-center gap-2 text-sm gold-action-btn disabled:opacity-50"
            >
              <Plus size={14} />
              {submitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Role"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
