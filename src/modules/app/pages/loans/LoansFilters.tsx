import { Search } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { LoanFilterTab, LoanSubFilter } from "./types";
import { TAB_SUB_FILTERS } from "./types";
import { getUnifiedStatusLabel } from "./helpers";

// ─── Props ──────────────────────────────────────────────────────────────

interface LoansFiltersProps {
  /** Active tab. */
  activeTab: LoanFilterTab;
  /** Tab change callback. */
  onTabChange: (tab: LoanFilterTab) => void;
  /** Active sub-filter within the tab. */
  subFilter: LoanSubFilter;
  /** Sub-filter change callback. */
  onSubFilterChange: (filter: LoanSubFilter) => void;
  /** Search input value. */
  searchTerm: string;
  /** Search change callback. */
  onSearchChange: (value: string) => void;
}

// ─── Category options ───────────────────────────────────────────────────

const CATEGORY_OPTIONS: LoanFilterTab[] = ["all", "request", "active_loan", "completed"];

// ─── Component ──────────────────────────────────────────────────────────

export function LoansFilters({
  activeTab,
  onTabChange,
  subFilter,
  onSubFilterChange,
  searchTerm,
  onSearchChange,
}: LoansFiltersProps) {
  const { language, t } = useLanguage();
  const lang = language === "es" ? "es" : "en";

  const subOptions = TAB_SUB_FILTERS[activeTab];

  return (
    <div className="space-y-4" data-help-id="loans-filters">
      {/* Search + Category dropdown + Sub-filter row */}
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

        <select
          value={activeTab}
          onChange={(e) => {
            onTabChange(e.target.value as LoanFilterTab);
            onSubFilterChange("all");
          }}
          className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700] transition-all min-w-[180px]"
          data-help-id="loans-category-filter"
        >
          {CATEGORY_OPTIONS.map((tab) => (
            <option key={tab} value={tab}>
              {t(`loans.tab.${tab}`)}
            </option>
          ))}
        </select>

        <select
          value={subFilter}
          onChange={(e) => onSubFilterChange(e.target.value as LoanSubFilter)}
          className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700] transition-all min-w-[180px]"
          data-help-id="loans-sub-filter"
        >
          <option value="all">{t("loans.filter.all")}</option>
          {subOptions.map((status) => (
            <option key={status} value={status}>
              {getUnifiedStatusLabel(status, lang)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
