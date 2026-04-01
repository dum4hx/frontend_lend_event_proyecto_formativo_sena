import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Lock,
  Shield,
  Search,
  Eye,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { ErrorDisplay } from "../../../../components/ui";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useConfirmModal } from "../../../../hooks/useConfirmModal";
import { getRoles, getPermissions, deleteRole } from "../../../../services/roleService";
import { normalizeError } from "../../../../utils/errorHandling";
import { useToast } from "../../../../contexts/ToastContext";
import { useDebounce } from "use-debounce";
import { AdminPagination, AdminTable, StatCard } from "../../components";
import type { Role } from "../../../../types/api";
import RoleFormModal from "./RoleFormModal";
import PermissionPreviewModal from "./PermissionPreviewModal";

type SortField = "name" | "type" | "permissions";
type SortDirection = "asc" | "desc";

const SORT_STORAGE_KEY = "roleManagement.sort";
const PAGE_SIZE_STORAGE_KEY = "roleManagement.pageSize";

export default function RoleManagement() {
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

  // ─── Restore persisted sort / page-size ────────────────────────────────────

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
      if ([8, 12, 20].includes(parsed)) setPageSize(parsed);
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

  // ─── Derived data ──────────────────────────────────────────────────────────

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

  const sortedRoles = useMemo(() => {
    const cloned = [...filteredRoles];
    cloned.sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sortDirection === "asc" ? cmp : -cmp;
      }
      if (sortField === "type") {
        const cmp = a.type.localeCompare(b.type);
        return sortDirection === "asc" ? cmp : -cmp;
      }
      const cmp = a.permissions.length - b.permissions.length;
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return cloned;
  }, [filteredRoles, sortField, sortDirection]);

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

  // ─── Helpers ───────────────────────────────────────────────────────────────

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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-full min-h-screen bg-[#121212] px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Role Management
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
              Manage organization roles and their permissions. System roles cannot be
              modified.
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

        {/* Stat cards */}
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

        {/* Filters */}
        <div className="card-compact mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-300">Roles</h2>
            <span className="badge badge-info">{sortedRoles.length} visible</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
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
                const [field, direction] = e.target.value.split(":") as [
                  SortField,
                  SortDirection,
                ];
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
          <ErrorDisplay
            error={rolesError}
            onRetry={() => void refetchRoles()}
            fullScreen={false}
          />
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
            {/* Desktop table */}
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
                    <tr
                      key={role._id}
                      className="border-b border-[#333] hover:bg-[#1a1a1a] transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">{role.name}</td>
                      <td className="px-6 py-4">
                        <span className={getRoleTypeBadgeClassName(role.type)}>
                          {role.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {role.description || (
                          <span className="text-gray-600">No description</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {role.permissions.length} permission
                        {role.permissions.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4">
                        {role.isReadOnly ? (
                          <span className="text-xs text-gray-500 italic">
                            System role
                          </span>
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

            {/* Mobile cards */}
            <div className="grid gap-3 lg:hidden">
              {pagedRoles.map((role) => (
                <div
                  key={role._id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 sm:p-5 flex flex-col gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{role.name}</h3>
                      <span className={getRoleTypeBadgeClassName(role.type)}>
                        {role.type}
                      </span>
                      {role.isReadOnly && <Lock size={13} className="text-gray-500" />}
                    </div>
                    {role.description && (
                      <p className="text-gray-400 text-sm break-words">
                        {role.description}
                      </p>
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

      {/* Preview modal */}
      {previewRole && (
        <PermissionPreviewModal
          role={previewRole}
          permissions={permissions}
          onClose={() => setPreviewRole(null)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}
