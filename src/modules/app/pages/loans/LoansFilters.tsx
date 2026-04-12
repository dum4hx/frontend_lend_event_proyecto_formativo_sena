import { Search, Calendar } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { getUnifiedStatusLabel } from "./helpers";
import type { UnifiedLoanStatus } from "./types";

// ─── Props ──────────────────────────────────────────────────────────────

interface LoansFiltersProps {
  /** Search input value. */
  searchTerm: string;
  /** Search change callback. */
  onSearchChange: (value: string) => void;
  /** Selected state filters for advanced search. */
  selectedStates: string[];
  /** Callback when state filters change. */
  onSelectedStatesChange: (states: string[]) => void;
  /** Date range start (YYYY-MM-DD) */
  dateFrom: string | null;
  /** Callback when date from changes. */
  onDateFromChange: (date: string | null) => void;
  /** Date range end (YYYY-MM-DD) */
  dateTo: string | null;
  /** Callback when date to changes. */
  onDateToChange: (date: string | null) => void;
  /** Callback to clear all filters. */
  onClearFilters: () => void;
}

// ─── Category options ───────────────────────────────────────────────────

// Removed: filters now handled only by status buttons and date range

// ─── Component ──────────────────────────────────────────────────────────

export function LoansFilters({
  searchTerm,
  onSearchChange,
  selectedStates,
  onSelectedStatesChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClearFilters,
}: LoansFiltersProps) {
  const { language, t } = useLanguage();
  const lang = language === "es" ? "es" : "en";

  // All possible states for toggle buttons
  const ALL_STATES = [
    "pending",
    "approved",
    "assigned",
    "ready",
    "active",
    "overdue",
    "returned",
    "inspected",
    "closed",
    "rejected",
    "cancelled",
    "expired",
  ] as const;

  const hasActiveFilters = selectedStates.length > 0 || dateFrom || dateTo;
  const dateError = dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom);

  const toggleState = (state: string) => {
    if (selectedStates.includes(state)) {
      onSelectedStatesChange(selectedStates.filter((s) => s !== state));
    } else {
      onSelectedStatesChange([...selectedStates, state]);
    }
  };

  const handleDateToChange = (value: string) => {
    if (!dateFrom || !value || new Date(value) >= new Date(dateFrom)) {
      onDateToChange(value || null);
    }
  };

  return (
    <div className="space-y-4" data-help-id="loans-filters">
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder={t("loans.filter.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] transition-all text-sm"
            data-help-id="loans-search"
          />
        </div>
      </div>

      {/* State filter buttons */}
      <div className="space-y-2" data-help-id="loans-state-filters">
        <label className="text-xs font-semibold text-gray-400 uppercase">
          {t("loans.filter.status") || "Estado"}
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_STATES.map((state) => (
            <button
              key={state}
              onClick={() => toggleState(state)}
              className={`px-3 py-1.5 text-xs rounded border transition-all ${
                selectedStates.includes(state)
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-transparent border-gray-600 text-gray-400 hover:border-gray-500"
              }`}
            >
              {getUnifiedStatusLabel(state as UnifiedLoanStatus, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Date range filters */}
      <div className="space-y-3" data-help-id="loans-date-filters">
        <label className="text-xs font-semibold text-gray-400 uppercase">
          {t("loans.filter.dateRange") || "Rango de Fechas"}
        </label>
        <div className="space-y-2">
          {/* Desde (inicio) */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#FFD700]" />
            <label className="text-xs text-gray-500 font-medium">
              {t("loans.filter.dateFrom") || "Desde (Inicio)"}
            </label>
          </div>
          <input
            type="date"
            value={dateFrom || ""}
            onChange={(e) => onDateFromChange(e.target.value || null)}
            placeholder="Fecha de inicio"
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333] rounded text-white text-sm focus:outline-none focus:border-[#FFD700] transition-all"
          />

          {/* Hasta (fin) */}
          <div className="flex items-center gap-2 mt-3">
            <Calendar size={14} className="text-[#FFD700]" />
            <label className="text-xs text-gray-500 font-medium">
              {t("loans.filter.dateTo") || "Hasta (Fin)"}
            </label>
          </div>
          <input
            type="date"
            value={dateTo || ""}
            onChange={(e) => handleDateToChange(e.target.value)}
            disabled={!dateFrom}
            min={dateFrom || undefined}
            placeholder="Fecha de fin"
            className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded text-sm focus:outline-none transition-all ${
              dateError ? "border-red-600 text-red-300 focus:border-red-500" : "border-[#333] text-white focus:border-[#FFD700]"
            } ${!dateFrom ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
        {dateError && dateTo && (
          <p className="text-xs text-red-400 mt-1">{t("loans.filter.dateError") || "End date must be after start date"}</p>
        )}
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full px-3 py-1.5 text-xs font-medium rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-all"
        >
          {t("loans.filter.clearFilters") || "Borrar filtros"}
        </button>
      )}
    </div>
  );
}
