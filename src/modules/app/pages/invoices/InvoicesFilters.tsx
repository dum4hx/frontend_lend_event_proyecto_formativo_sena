import { Search } from "lucide-react";
import type { InvoiceTab, InvoiceStatus, InvoiceType } from "./types";

// ─── Props ──────────────────────────────────────────────────────────────

interface InvoicesFiltersProps {
  /** Active tab. */
  activeTab: InvoiceTab;
  /** Tab change callback. */
  onTabChange: (tab: InvoiceTab) => void;
  /** Current search text. */
  searchTerm: string;
  /** Search text change callback. */
  onSearchChange: (value: string) => void;
  /** Status filter value. */
  statusFilter: InvoiceStatus | "all";
  /** Status filter change callback. */
  onStatusFilterChange: (value: InvoiceStatus | "all") => void;
  /** Type filter value. */
  typeFilter: InvoiceType | "all";
  /** Type filter change callback. */
  onTypeFilterChange: (value: InvoiceType | "all") => void;
  /** Overdue-only toggle. */
  overdueOnly: boolean;
  /** Overdue-only toggle callback. */
  onOverdueChange: (value: boolean) => void;
  /** Whether Spanish locale is active. */
  isEs: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────

export function InvoicesFilters({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  overdueOnly,
  onOverdueChange,
  isEs,
}: InvoicesFiltersProps) {
  const tabs: InvoiceTab[] = ["all", "pending", "overdue"];

  const tabLabels: Record<InvoiceTab, string> = {
    all: isEs ? "Todas" : "All",
    pending: isEs ? "Pendientes" : "Pending",
    overdue: isEs ? "Vencidas" : "Overdue",
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-1">
        <div className="flex space-x-6 md:space-x-10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`pb-4 text-sm font-bold tracking-wide transition-all relative whitespace-nowrap ${
                activeTab === tab ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tabLabels[tab]}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFD700] rounded-t-full shadow-[0_-2px_6px_rgba(255,215,0,0.4)]" />
              )}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-2 w-full md:w-auto">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as InvoiceStatus | "all")}
            className="bg-[#121212] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700] transition-all"
          >
            <option value="all">{isEs ? "Todos los estados" : "All Statuses"}</option>
            <option value="pending">{isEs ? "Pendiente" : "Pending"}</option>
            <option value="paid">{isEs ? "Pagado" : "Paid"}</option>
            <option value="cancelled">{isEs ? "Cancelado" : "Cancelled"}</option>
          </select>

          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as InvoiceType | "all")}
            className="bg-[#121212] border border-[#222] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFD700] transition-all"
          >
            <option value="all">{isEs ? "Todos los tipos" : "All Types"}</option>
            <option value="rental">{isEs ? "Alquiler" : "Rental"}</option>
            <option value="damage">{isEs ? "Daño" : "Damage"}</option>
            <option value="deposit">{isEs ? "Depósito" : "Deposit"}</option>
          </select>

          {/* Overdue Checkbox */}
          <label className="flex items-center gap-2 px-3 py-2 bg-[#121212] border border-[#222] rounded-lg text-xs cursor-pointer hover:border-[#333] transition-all">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => onOverdueChange(e.target.checked)}
              className="accent-[#FFD700] w-4 h-4"
            />
            <span className="text-gray-300">{isEs ? "Solo vencidas" : "Overdue Only"}</span>
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full group mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
        <input
          type="text"
          placeholder={
            isEs ? "Buscar por ID de factura o cliente..." : "Search by invoice ID or customer..."
          }
          className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
