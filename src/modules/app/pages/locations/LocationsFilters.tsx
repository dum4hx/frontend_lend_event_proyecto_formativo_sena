/**
 * LocationsFilters — Search + status filter bar
 */

import { Search } from "lucide-react";
import { SearchableSelect, type SelectOption } from "../../../../components/ui";
import { useLanguage } from "../../../../contexts/useLanguage";
import { STATUS_OPTIONS } from "./types";

interface LocationsFiltersProps {
  /** Current search term */
  search: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Current status filter value */
  statusFilter: string;
  /** Status filter change handler */
  onStatusFilterChange: (value: string) => void;
}

export function LocationsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: LocationsFiltersProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const statusOptions: SelectOption[] = [
    { value: "", label: isEs ? "Todos los estados" : "All Statuses" },
    ...STATUS_OPTIONS.map((s) => ({
      value: s.value,
      label: isEs ? s.labelEs : s.labelEn,
    })),
  ];

  return (
    <div className="filter-bar">
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-4 top-3 text-gray-500" size={20} />
        <input
          type="text"
          placeholder={isEs ? "Buscar por nombre o dirección..." : "Search by name or address..."}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
        />
      </div>
      <div className="w-56">
        <SearchableSelect
          options={statusOptions}
          value={statusFilter}
          onChange={onStatusFilterChange}
          placeholder={isEs ? "Filtrar por estado" : "Filter by status"}
        />
      </div>
    </div>
  );
}
