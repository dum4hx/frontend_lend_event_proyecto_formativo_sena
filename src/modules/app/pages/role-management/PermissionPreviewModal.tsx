import { useMemo } from "react";
import { X } from "lucide-react";
import type { Role, Permission } from "../../../../types/api";

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
  const permissionById = useMemo(() => new Map(permissions.map((p) => [p.id, p])), [permissions]);

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#121212] border-b border-[#333] p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Permissions · {role.name}</h3>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {resolvedPermissions.length} assigned permission
              {resolvedPermissions.length !== 1 ? "s" : ""}
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
            <div className="text-center text-gray-500 py-10">
              This role has no assigned permissions.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByCategory.map((group) => (
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
                        key={permission.id}
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
  );
}
