import { useMemo, useState } from "react";
import { X, ChevronDown, ChevronRight, Link2 } from "lucide-react";
import type { Role, Permission } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";

interface PermissionPreviewModalProps {
  role: Role;
  permissions: Permission[];
  onClose: () => void;
}

export default function PermissionPreviewModal({
  role,
  permissions,
  onClose,
}: PermissionPreviewModalProps) {
  const { t } = useLanguage();
  const [expandedDeps, setExpandedDeps] = useState<Set<string>>(new Set());

  const permissionById = useMemo(() => new Map(permissions.map((p) => [p.id, p])), [permissions]);

  const rolePermissionSet = useMemo(() => new Set(role.permissions), [role.permissions]);

  const resolvedPermissions = useMemo(
    () =>
      role.permissions
        .map((id) => permissionById.get(id))
        .filter((p): p is Permission => Boolean(p)),
    [role.permissions, permissionById],
  );

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    resolvedPermissions.forEach((p) => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, perms]) => ({
        category,
        permissions: [...perms].sort((a, b) => a.displayName.localeCompare(b.displayName)),
      }));
  }, [resolvedPermissions]);

  const toggleDeps = (permId: string) => {
    setExpandedDeps((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">
              {t("roles.permissions")} · {role.name}
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {resolvedPermissions.length} {t("roles.permissionsSelected")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {resolvedPermissions.length === 0 ? (
            <div className="text-center text-gray-500 py-10">{t("roles.noPermissions")}</div>
          ) : (
            <div className="space-y-4">
              {groupedByCategory.map((group) => (
                <div key={group.category}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.category}
                    </p>
                    <span className="text-xs text-gray-500">
                      {group.permissions.length} {t("roles.permissionsSelected")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.permissions.map((permission) => {
                      const requires = permission.requires ?? [];
                      const hasDeps = requires.length > 0;
                      const isExpanded = expandedDeps.has(permission.id);
                      const missingDeps = hasDeps
                        ? requires.filter((r) => !rolePermissionSet.has(r))
                        : [];

                      return (
                        <div
                          key={permission.id}
                          className={`bg-[#1a1a1a] border rounded-lg p-3 ${
                            missingDeps.length > 0 ? "border-amber-700/50" : "border-[#2a2a2a]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-sm font-medium">
                              {permission.displayName}
                            </p>
                            {hasDeps && (
                              <button
                                type="button"
                                onClick={() => toggleDeps(permission.id)}
                                className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors ${
                                  missingDeps.length > 0
                                    ? "text-amber-400 hover:bg-amber-900/30"
                                    : "text-gray-400 hover:bg-[#252525]"
                                }`}
                                title={
                                  isExpanded
                                    ? t("permissions.hideDependencies")
                                    : t("permissions.showDependencies")
                                }
                              >
                                <Link2 size={12} />
                                <span>{requires.length}</span>
                                {isExpanded ? (
                                  <ChevronDown size={12} />
                                ) : (
                                  <ChevronRight size={12} />
                                )}
                              </button>
                            )}
                          </div>

                          {hasDeps && isExpanded && (
                            <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                              <p className="text-xs text-gray-500 mb-1.5">
                                {t("permissions.requires")}:
                              </p>
                              <ul className="space-y-1">
                                {requires.map((reqId) => {
                                  const reqPerm = permissionById.get(reqId);
                                  const isSatisfied = rolePermissionSet.has(reqId);
                                  return (
                                    <li key={reqId} className="flex items-center gap-2 text-xs">
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                          isSatisfied ? "bg-green-500" : "bg-amber-500"
                                        }`}
                                      />
                                      <span
                                        className={isSatisfied ? "text-gray-300" : "text-amber-400"}
                                      >
                                        {reqPerm?.displayName ?? reqId}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
