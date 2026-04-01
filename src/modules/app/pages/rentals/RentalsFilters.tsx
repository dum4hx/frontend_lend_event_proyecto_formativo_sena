import { Search, ChevronDown } from "lucide-react";
import type { LoanFilter } from "./types";
import { STATUS_OPTIONS } from "./types";
import { getStatusLabel } from "./helpers";

// ─── Props ──────────────────────────────────────────────────────────────

interface RentalsFiltersProps {
  /** Current search term. */
  searchTerm: string;
  /** Search term change callback. */
  onSearchChange: (value: string) => void;
  /** Selected status filter. */
  selectedStatus: LoanFilter;
  /** Status filter change callback. */
  onStatusChange: (value: LoanFilter) => void;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export function RentalsFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  isEs,
}: RentalsFiltersProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex-1 min-w-[250px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder={
            isEs ? "Buscar por ID de prestamo o cliente..." : "Search by loan ID or customer..."
          }
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>
      <div className="relative">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as LoanFilter)}
          className="appearance-none px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white focus:outline-none focus:border-[#FFD700] transition-all cursor-pointer pr-10"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {getStatusLabel(opt, isEs)}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          size={20}
        />
      </div>
    </div>
  );
}
