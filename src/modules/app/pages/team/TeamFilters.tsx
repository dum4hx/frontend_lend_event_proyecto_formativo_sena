/**
 * TeamFilters — Search + role/status filter bar for the Team page.
 */
import { Search } from "lucide-react";
import { SearchableSelect } from "../../../../components/ui/SearchableSelect";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { Role } from "../../../../types/api";
import type { TeamMemberStatus } from "./types";

interface TeamFiltersProps {
  /** Current text search value. */
  search: string;
  onSearchChange: (v: string) => void;
  /** Filter by role ID. Empty string = all. */
  roleId: string;
  onRoleChange: (v: string) => void;
  /** Filter by status. Empty string = all. */
  status: string;
  onStatusChange: (v: string) => void;
  availableRoles: Role[];
}

const STATUS_OPTIONS_EN = [
  { value: "", label: "All Statuses" },
  { value: "active" satisfies TeamMemberStatus, label: "Active" },
  { value: "inactive" satisfies TeamMemberStatus, label: "Inactive" },
  { value: "invited" satisfies TeamMemberStatus, label: "Invited" },
];

const STATUS_OPTIONS_ES = [
  { value: "", label: "Todos los estados" },
  { value: "active" satisfies TeamMemberStatus, label: "Activo" },
  { value: "inactive" satisfies TeamMemberStatus, label: "Inactivo" },
  { value: "invited" satisfies TeamMemberStatus, label: "Invitado" },
];

export function TeamFilters({
  search,
  onSearchChange,
  roleId,
  onRoleChange,
  status,
  onStatusChange,
  availableRoles,
}: TeamFiltersProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const roleOptions = [
    { value: "", label: isEs ? "Todos los roles" : "All Roles" },
    ...availableRoles.map((r) => ({ value: r._id, label: r.name })),
  ];

  const statusOptions = isEs ? STATUS_OPTIONS_ES : STATUS_OPTIONS_EN;

  return (
    <div className="filter-bar">
      {/* Text search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={isEs ? "Buscar por nombre o correo..." : "Search by name or email..."}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
        />
      </div>

      {/* Role filter */}
      <div className="w-48">
        <SearchableSelect
          options={roleOptions}
          value={roleId}
          onChange={onRoleChange}
          placeholder={isEs ? "Rol" : "Role"}
        />
      </div>

      {/* Status filter */}
      <div className="w-44">
        <SearchableSelect
          options={statusOptions}
          value={status}
          onChange={onStatusChange}
          placeholder={isEs ? "Estado" : "Status"}
        />
      </div>
    </div>
  );
}
