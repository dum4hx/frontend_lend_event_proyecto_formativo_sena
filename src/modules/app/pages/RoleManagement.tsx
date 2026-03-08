import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Lock, Shield, Search, X } from "lucide-react";
import { LoadingSpinner, ErrorDisplay } from "../../../components/ui";
import { useApiQuery } from "../../../hooks/useApiQuery";
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
} from "../../../services/roleService";
import { normalizeError, logError } from "../../../utils/errorHandling";
import { useToast } from "../../../contexts/ToastContext";
import { validateRoleName } from "../../../utils/validators";
import type { Role, Permission } from "../../../types/api";

// ─── Role Form Modal ────────────────────────────────────────────────────────

interface RoleFormModalProps {
  mode: "create" | "edit";
  role?: Role;
  permissions: Permission[];
  onClose: () => void;
  onSaved: () => void;
}

function RoleFormModal({ mode, role, permissions, onClose, onSaved }: RoleFormModalProps) {
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

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

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

  const togglePermission = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

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
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-6 flex items-center justify-between">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
            <label className="block text-sm font-semibold text-gray-400 mb-1">Description</label>
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
            <div className="flex items-center justify-between mb-2">
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
                  <div className="grid grid-cols-2 gap-1">
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
              className="px-5 py-2 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition flex items-center gap-2 text-sm disabled:opacity-50"
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

// ─── Role Management Page ───────────────────────────────────────────────────

/**
 * Role Management — lists all organization roles, allows creating new custom
 * roles, editing existing custom roles, and deleting them.
 * System roles (isReadOnly: true) are displayed but cannot be modified.
 */
export default function RoleManagement() {
  const { showToast } = useToast();

  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useApiQuery(async () => {
    const res = await getRoles();
    return res.data.items;
  });

  const { data: permsData, isLoading: permsLoading } = useApiQuery(async () => {
    const res = await getPermissions();
    return res.data.permissions;
  });

  const roles = rolesData ?? [];
  const permissions = permsData ?? [];

  type ModalState = { type: "create" } | { type: "edit"; role: Role } | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (role: Role) => {
    showToast(
      "warning",
      `Delete role "${role.name}"? Users with this role may lose access. This cannot be undone.`,
      "Confirm Deletion",
      {
        duration: Infinity,
        action: {
          label: "Delete",
          onClick: async () => {
            setDeletingId(role._id);
            try {
              await deleteRole(role._id);
              showToast("success", `Role "${role.name}" deleted`, "Deleted");
              void refetchRoles();
            } catch (err: unknown) {
              showToast("error", normalizeError(err).message, "Error");
            } finally {
              setDeletingId(null);
            }
          },
        },
      },
    );
  };

  if (rolesLoading || permsLoading) {
    return <LoadingSpinner fullScreen message="Loading roles..." />;
  }

  if (rolesError) {
    return <ErrorDisplay error={rolesError} onRetry={() => void refetchRoles()} fullScreen />;
  }

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Role Management</h1>
            <p className="text-gray-400">
              Manage organization roles and their permissions. System roles cannot be modified.
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#FFD700] text-black font-semibold rounded-lg hover:bg-yellow-300 transition"
          >
            <Plus size={18} />
            New Role
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles..."
            className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
          />
        </div>

        {/* Roles list */}
        {filteredRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Shield size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">
              {search ? "No roles match your search" : "No roles found"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredRoles.map((role) => (
              <div
                key={role._id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Role info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{role.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        role.type === "SYSTEM"
                          ? "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20"
                          : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }`}
                    >
                      {role.type}
                    </span>
                    {role.isReadOnly && <Lock size={13} className="text-gray-500" />}
                  </div>
                  {role.description && (
                    <p className="text-gray-400 text-sm truncate">{role.description}</p>
                  )}
                  <p className="text-gray-600 text-xs mt-1">
                    {role.permissions.length} permission
                    {role.permissions.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {role.isReadOnly ? (
                    <span className="text-xs text-gray-600 italic">
                      System role — cannot be modified
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => setModal({ type: "edit", role })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 border border-[#333] rounded-lg hover:bg-[#222] hover:text-white transition"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        disabled={deletingId === role._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 border border-red-400/20 rounded-lg hover:bg-red-400/10 transition disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletingId === role._id ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <RoleFormModal
          mode={modal.type}
          role={modal.type === "edit" ? modal.role : undefined}
          permissions={permissions}
          onClose={() => setModal(null)}
          onSaved={() => void refetchRoles()}
        />
      )}
    </div>
  );
}
