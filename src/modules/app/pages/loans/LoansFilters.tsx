import { Search, X } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { getUnifiedStatusBadgeStyle } from "./helpers";
import type { UnifiedLoanStatus } from "./types";

// ─── Status dot colors (filter-chip indicator) ─────────────────────────

const DOT_COLOR: Record<UnifiedLoanStatus, string> = {
  pending: "bg-yellow-400",
  approved: "bg-emerald-400",
  assigned: "bg-indigo-400",
  ready: "bg-cyan-400",
  active: "bg-green-400",
  overdue: "bg-red-400",
  returned: "bg-blue-400",
  closed: "bg-zinc-400",
  rejected: "bg-rose-400",
  cancelled: "bg-zinc-500",
  expired: "bg-orange-400",
};

const WORKFLOW_STATES: UnifiedLoanStatus[] = [
  "pending",
  "approved",
  "ready",
  "active",
  "overdue",
  "returned",
  "closed",
];

const TERMINAL_STATES: UnifiedLoanStatus[] = ["rejected", "cancelled", "expired"];

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
  const { t } = useLanguage();

  const today = new Date().toISOString().split("T")[0];
  const hasActiveFilters = selectedStates.length > 0 || !!dateFrom || !!dateTo;
  const dateError = dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom);

  const handleDateFromChange = (value: string | null) => {
    if (value && value > today) return;
    onDateFromChange(value);
    if (value && dateTo && dateTo < value) {
      onDateToChange(null);
    }
  };

  const handleDateToChange = (value: string | null) => {
    if (value && dateFrom && value < dateFrom) return;
    onDateToChange(value);
  };

  const toggleState = (state: string) => {
    if (selectedStates.includes(state)) {
      onSelectedStatesChange(selectedStates.filter((s) => s !== state));
    } else {
      onSelectedStatesChange([...selectedStates, state]);
    }
  };

  const renderChip = (state: UnifiedLoanStatus) => {
    const selected = selectedStates.includes(state);
    const badgeStyle = selected ? getUnifiedStatusBadgeStyle(state) : "";

    return (
      <button
        key={state}
        onClick={() => toggleState(state)}
        className={`px-2 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all ${
          selected
            ? badgeStyle
            : "bg-transparent border border-zinc-700 text-zinc-400 hover:border-zinc-500"
        }`}
      >
        <span
          className={`inline-block w-2 h-2 rounded-full shrink-0 ${DOT_COLOR[state]} ${
            selected ? "" : "opacity-40"
          }`}
        />
        {t(`loans.filter.${state}` as Parameters<typeof t>[0])}
      </button>
    );
  };

  return (
    <div className="space-y-3" data-help-id="loans-filters">
      {/* ── Search + Date range row ── */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3">
        {/* Search */}
        <div className="flex flex-col flex-1">
          <label className="text-xs text-zinc-500 mb-1 lg:invisible">&nbsp;</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder={t("loans.filter.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] transition-all text-sm"
              data-help-id="loans-search"
            />
          </div>
        </div>

        {/* Date range — side by side */}
        <div className="flex items-end gap-2 w-full lg:w-auto" data-help-id="loans-date-filters">
          <div className="flex flex-col flex-1 lg:flex-none">
            <label className="text-xs text-zinc-500 mb-1">{t("loans.filter.dateFrom")}</label>
            <input
              type="date"
              value={dateFrom || ""}
              max={today}
              onChange={(e) => handleDateFromChange(e.target.value || null)}
              className={`px-2.5 py-2 bg-[#1a1a1a] border rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700] transition-all w-full lg:w-36 ${
                dateError ? "border-red-600" : "border-[#333]"
              }`}
            />
          </div>
          <span className="text-zinc-600 pb-2.5 text-sm">–</span>
          <div className="flex flex-col flex-1 lg:flex-none">
            <label className="text-xs text-zinc-500 mb-1">{t("loans.filter.dateTo")}</label>
            <input
              type="date"
              value={dateTo || ""}
              min={dateFrom || undefined}
              onChange={(e) => handleDateToChange(e.target.value || null)}
              className={`px-2.5 py-2 bg-[#1a1a1a] border rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700] transition-all w-full lg:w-36 ${
                dateError ? "border-red-600" : "border-[#333]"
              }`}
            />
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 mb-px text-xs font-medium rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all w-full lg:w-auto"
          >
            <X size={12} />
            {t("loans.filter.clearFilters")}
          </button>
        )}
      </div>

      {dateError && <p className="text-xs text-red-400">{t("loans.filter.dateError")}</p>}

      {/* ── Status chips ── */}
      <div className="space-y-2" data-help-id="loans-state-filters">
        {/* Workflow group */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mr-0.5">
            {t("loans.filter.groupWorkflow")}
          </span>
          {WORKFLOW_STATES.map(renderChip)}
        </div>

        {/* Terminal group */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mr-0.5">
            {t("loans.filter.groupTerminal")}
          </span>
          {TERMINAL_STATES.map(renderChip)}
        </div>
      </div>
    </div>
  );
}
