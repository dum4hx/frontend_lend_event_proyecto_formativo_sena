import { Search } from "lucide-react";
import { SearchableSelect } from "../../../../components/ui";
import type { WorkflowFilter } from "./types";
import { getFilterOptions } from "./types";

interface OrdersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: WorkflowFilter;
  onStatusChange: (value: WorkflowFilter) => void;
  isEs: boolean;
}

export function OrdersFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  isEs,
}: OrdersFiltersProps) {
  const filterOptions = getFilterOptions(isEs ? "es" : "en");

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 md:gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder={
            isEs
              ? "Buscar por código de solicitud o cliente..."
              : "Search by request code or customer..."
          }
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-[#1a1a1a] border border-[#333] rounded-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700]/80 focus:ring-1 focus:ring-[#FFD700]/30 transition-all"
        />
      </div>

      <SearchableSelect
        options={filterOptions.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        value={selectedStatus}
        onChange={(val) => onStatusChange(val as WorkflowFilter)}
        placeholder={isEs ? "Estado" : "Status"}
      />
    </div>
  );
}
