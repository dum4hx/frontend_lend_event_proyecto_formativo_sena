import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Lock,
  Shield,
  Search,
  X,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ErrorDisplay } from "../../../components/ui";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
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
import { useDebounce } from "use-debounce";
import { AdminPagination, AdminTable, StatCard } from "../components";
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

// ─── Role Management Page ───────────────────────────────────────────────────

/**
 * Role Management — lists all organization roles, allows creating new custom
 * roles, editing existing custom roles, and deleting them.
 * System roles (isReadOnly: true) are displayed but cannot be modified.
 */
export default function RoleManagement() {
  type SortField = "name" | "type" | "permissions";
  type SortDirection = "asc" | "desc";
  const SORT_STORAGE_KEY = "roleManagement.sort";
  const PAGE_SIZE_STORAGE_KEY = "roleManagement.pageSize";

  const { showToast } = useToast();
  const { showConfirm, ConfirmModal } = useConfirmModal();

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

  const roles = useMemo(() => rolesData ?? [], [rolesData]);
  const permissions = useMemo(() => permsData ?? [], [permsData]);

  type ModalState = { type: "create" } | { type: "edit"; role: Role } | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [previewRole, setPreviewRole] = useState<Role | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSort = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (storedSort) {
      try {
        const parsed = JSON.parse(storedSort) as {
          field?: SortField;
          direction?: SortDirection;
        };

        if (parsed.field && ["name", "type", "permissions"].includes(parsed.field)) {
          setSortField(parsed.field);
        }

        if (parsed.direction && ["asc", "desc"].includes(parsed.direction)) {
          setSortDirection(parsed.direction);
        }
      } catch {
        // Ignore malformed persisted sort settings.
      }
    }

    const storedPageSize = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (storedPageSize) {
      const parsed = Number(storedPageSize);
      if ([8, 12, 20].includes(parsed)) {
        setPageSize(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      SORT_STORAGE_KEY,
      JSON.stringify({ field: sortField, direction: sortDirection }),
    );
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [sortField, sortDirection, pageSize]);

  const filteredRoles = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    if (!normalizedSearch) return roles;

    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(normalizedSearch) ||
        (r.description ?? "").toLowerCase().includes(normalizedSearch),
    );
  }, [roles, debouncedSearch]);

  const roleMetrics = useMemo(() => {
    const systemRoles = roles.filter((role) => role.type === "SYSTEM").length;
    const customRoles = roles.length - systemRoles;
    const totalPermissionAssignments = roles.reduce(
      (acc, role) => acc + role.permissions.length,
      0,
    );
    const uniquePermissionIds = new Set(roles.flatMap((role) => role.permissions));
    const uniquePermissionsUsed = uniquePermissionIds.size;
    const totalPermissionsInCatalog = permissions.length;
    const permissionCoverage =
      totalPermissionsInCatalog > 0
        ? Math.round((uniquePermissionsUsed / totalPermissionsInCatalog) * 100)
        : 0;

    return {
      totalRoles: roles.length,
      systemRoles,
      customRoles,
      totalPermissionAssignments,
      uniquePermissionsUsed,
      totalPermissionsInCatalog,
      permissionCoverage,
    };
  }, [roles, permissions]);

  const permissionById = useMemo(
    () => new Map(permissions.map((permission) => [permission._id, permission])),
    [permissions],
  );

  const sortedRoles = useMemo(() => {
    const cloned = [...filteredRoles];

    cloned.sort((a, b) => {
      if (sortField === "name") {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (sortField === "type") {
        const comparison = a.type.localeCompare(b.type);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      const comparison = a.permissions.length - b.permissions.length;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return cloned;
  }, [filteredRoles, sortField, sortDirection]);

  const previewPermissions = useMemo(() => {
    if (!previewRole) return [];

    return previewRole.permissions
      .map((permissionId) => permissionById.get(permissionId))
      .filter((permission): permission is Permission => Boolean(permission));
  }, [previewRole, permissionById]);

  const previewPermissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};

    previewPermissions.forEach((permission) => {
      if (!grouped[permission.category]) {
        grouped[permission.category] = [];
      }
      grouped[permission.category].push(permission);
    });

    return Object.entries(grouped)
      .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
      .map(([category, categoryPermissions]) => ({
        category,
        permissions: [...categoryPermissions].sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        ),
      }));
  }, [previewPermissions]);

  const totalPages = Math.max(1, Math.ceil(sortedRoles.length / pageSize));

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortField, sortDirection, pageSize]);

  const pagedRoles = useMemo(
    () => sortedRoles.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedRoles, currentPage, pageSize],
  );

  const getRoleTypeBadgeClassName = (type: Role["type"]) =>
    type === "SYSTEM"
      ? "badge badge-warning"
      : "bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-2 py-0.5 rounded-full font-medium";

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "permissions" ? "desc" : "asc");
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleDelete = async (role: Role) => {
    const confirmed = await showConfirm({
      title: `Delete role ${role.name}?`,
      message:
        "Users with this role may lose access. This destructive action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

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
  };

  return (
    <div className="w-full max-w-full min-h-screen bg-[#121212] px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Role Management</h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
              Manage organization roles and their permissions. System roles cannot be modified.
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-lg transition gold-action-btn"
          >
            <Plus size={18} />
            New Role
          </button>
        </div>

        {rolesLoading || permsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="card h-[92px] animate-pulse">
                <div className="h-4 bg-[#1a1a1a] rounded w-1/2 mb-3" />
                <div className="h-7 bg-[#1a1a1a] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 mb-6">
            <StatCard
              label="Total roles"
              value={roleMetrics.totalRoles}
              icon={<Shield size={18} />}
            />
            <StatCard
              label="System roles"
              value={roleMetrics.systemRoles}
              icon={<Lock size={18} />}
            />
            <StatCard
              label="Custom roles"
              value={roleMetrics.customRoles}
              icon={<Plus size={18} />}
            />
            <StatCard
              label="Permission assignments"
              value={roleMetrics.totalPermissionAssignments}
              icon={<Search size={18} />}
            />
            <StatCard
              label="Unique permissions used"
              value={`${roleMetrics.uniquePermissionsUsed} / ${roleMetrics.totalPermissionsInCatalog}`}
              icon={<Lock size={18} />}
              trend={`${roleMetrics.permissionCoverage}% coverage`}
              trendUp={roleMetrics.permissionCoverage >= 60}
            />
          </div>
        )}

        <div className="card-compact mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-300">Roles</h2>
            <span className="badge badge-info">{sortedRoles.length} visible</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
              />
            </div>

            <select
              title="Sort roles"
              aria-label="Sort roles"
              value={`${sortField}:${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split(":") as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="input lg:w-[220px]"
            >
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="type:asc">Type (A-Z)</option>
              <option value="type:desc">Type (Z-A)</option>
              <option value="permissions:desc">Permissions (High-Low)</option>
              <option value="permissions:asc">Permissions (Low-High)</option>
            </select>

            <select
              title="Roles per page"
              aria-label="Roles per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="input lg:w-[170px]"
            >
              <option value={8}>8 per page</option>
              <option value={12}>12 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
        </div>

        {/* Roles list */}
        {rolesError ? (
          <ErrorDisplay error={rolesError} onRetry={() => void refetchRoles()} fullScreen={false} />
        ) : rolesLoading || permsLoading ? (
          <div className="card space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-[#1a1a1a] rounded animate-pulse" />
            ))}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Shield size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">
              {search ? "No roles match your search" : "No roles found"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block">
              <AdminTable>
                <thead className="bg-[#0f0f0f] border-b border-[#333]">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSortToggle("name")}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Role
                        {renderSortIcon("name")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSortToggle("type")}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Type
                        {renderSortIcon("type")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      <button
                        type="button"
                        onClick={() => handleSortToggle("permissions")}
                        className="inline-flex items-center gap-1 hover:text-white transition-colors"
                      >
                        Permissions
                        {renderSortIcon("permissions")}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-gray-400 text-xs font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRoles.map((role) => (
                    <tr key={role._id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{role.name}</td>
                      <td className="px-6 py-4">
                        <span className={getRoleTypeBadgeClassName(role.type)}>{role.type}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {role.description || <span className="text-gray-600">No description</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4">
                        {role.isReadOnly ? (
                          <span className="text-xs text-gray-500 italic">System role</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewRole(role)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-200 transition"
                            >
                              <Eye size={14} />
                              Permissions
                            </button>
                            <button
                              onClick={() => setModal({ type: "edit", role })}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 border border-[#333] rounded-lg hover:bg-[#222] hover:text-white transition"
                            >
                              <Edit size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => void handleDelete(role)}
                              disabled={deletingId === role._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-50 danger-action-btn"
                            >
                              <Trash2 size={14} />
                              {deletingId === role._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </div>

            <div className="grid gap-3 lg:hidden">
              {pagedRoles.map((role) => (
                <div
                  key={role._id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 sm:p-5 flex flex-col gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{role.name}</h3>
                      <span className={getRoleTypeBadgeClassName(role.type)}>{role.type}</span>
                      {role.isReadOnly && <Lock size={13} className="text-gray-500" />}
                    </div>
                    {role.description && (
                      <p className="text-gray-400 text-sm break-words">{role.description}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-1">
                      {role.permissions.length} permission
                      {role.permissions.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full">
                    {role.isReadOnly ? (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => setPreviewRole(role)}
                          className="flex-1 justify-center flex items-center gap-1.5 px-3 py-1.5 text-sm text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-200 transition min-w-[120px]"
                        >
                          <Eye size={14} />
                          Permissions
                        </button>
                        <span className="text-xs text-gray-500 italic w-full sm:w-auto">
                          System role — cannot be modified
                        </span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setPreviewRole(role)}
                          className="flex-1 justify-center flex items-center gap-1.5 px-3 py-1.5 text-sm text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-200 transition min-w-[120px]"
                        >
                          <Eye size={14} />
                          Permissions
                        </button>
                        <button
                          onClick={() => setModal({ type: "edit", role })}
                          className="flex-1 justify-center flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 border border-[#333] rounded-lg hover:bg-[#222] hover:text-white transition min-w-[120px]"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => void handleDelete(role)}
                          disabled={deletingId === role._id}
                          className="flex-1 justify-center flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition disabled:opacity-50 danger-action-btn min-w-[120px]"
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

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedRoles.length}
              pageSize={pageSize}
              itemLabel="roles"
              onPageChange={setCurrentPage}
            />
          </>
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

      {previewRole && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Permissions · {previewRole.name}</h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  {previewPermissions.length} assigned permission
                  {previewPermissions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRole(null)}
                className="text-gray-400 hover:text-white p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {previewPermissions.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                  This role has no assigned permissions.
                </div>
              ) : (
                <div className="space-y-4">
                  {previewPermissionsByCategory.map((group) => (
                    <div key={group.category}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {group.category}
                        </p>
                        <span className="text-xs text-gray-500">
                          {group.permissions.length} permission
                          {group.permissions.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.permissions.map((permission) => (
                          <div
                            key={permission._id}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3"
                          >
                            <p className="text-white text-sm font-medium">{permission.displayName}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal />
    </div>
  );
}
