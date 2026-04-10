import { useState } from "react";
import { Filter, Search } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCustomers } from "../../../../hooks/queries/useCustomerQueries";
import { useLocations } from "../../../../hooks/queries/useOrgQueries";
import { useMaterialCategories } from "../../../../hooks/queries/useMaterialQueries";
import { validateSearchQuery } from "../../../../utils/validators";
import type {
  ReportModule,
  DateRange,
  ModuleFilters,
  CustomerStatus,
  LoanRequestStatus,
  LoanStatus,
  InvoiceStatus,
  TransferStatus,
} from "./types";

interface ReportsFiltersProps {
  activeModule: ReportModule;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  filters: ModuleFilters;
  onFilterChange: <M extends ReportModule>(
    mod: M,
    key: keyof ModuleFilters[M],
    value: ModuleFilters[M][keyof ModuleFilters[M]],
  ) => void;
  onPageReset: () => void;
  isEs?: boolean;
}

export function ReportsFilters({
  activeModule,
  dateRange,
  onDateRangeChange,
  filters,
  onFilterChange,
  onPageReset,
}: ReportsFiltersProps) {
  const { t } = useLanguage();
  const [searchError, setSearchError] = useState<string | undefined>();

  const { data: customersData } = useCustomers({ limit: 100 });
  const locations = useLocations();
  const categories = useMaterialCategories();

  const customersList = customersData?.customers ?? [];
  const locationsList = locations.data ?? [];
  const categoriesList = categories.data ?? [];

  const formatCustomerName = (c: { name: { firstName: string; firstSurname: string } }) =>
    `${c.name.firstName} ${c.name.firstSurname}`;

  const handleSearchChange = (value: string) => {
    const result = validateSearchQuery(value);
    setSearchError(result.isValid ? undefined : result.message);
    onFilterChange("inventory", "search", value);
    onPageReset();
  };

  const handleDateFrom = (value: string) => {
    if (value && dateRange.to && value > dateRange.to) {
      // "from" jumped past "to" — clear "to" to keep the range valid
      onDateRangeChange({ from: value, to: "" });
    } else {
      onDateRangeChange({ ...dateRange, from: value });
    }
    onPageReset();
  };

  const handleDateTo = (value: string) => {
    if (value && dateRange.from && value < dateRange.from) {
      // "to" moved before "from" — clear "from" to keep the range valid
      onDateRangeChange({ from: "", to: value });
    } else {
      onDateRangeChange({ ...dateRange, to: value });
    }
    onPageReset();
  };

  const dateRangeError = !!dateRange.from && !!dateRange.to && dateRange.from > dateRange.to;

  const selectClass =
    "w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-400 transition";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-yellow-400" />
        <span className="text-sm font-semibold text-gray-300">{t("reports.filter.title")}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.from")}</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => handleDateFrom(e.target.value)}
            max={dateRange.to || undefined}
            className={`${selectClass} ${dateRangeError ? "border-red-500" : ""}`}
            aria-invalid={dateRangeError}
            aria-describedby={dateRangeError ? "date-range-error" : undefined}
          />
        </div>
        {/* Date To */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {t("reports.filter.to")}
            {dateRange.from && (
              <span className="ml-1 text-yellow-500 text-xs">
                ({t("reports.filter.minDate")}: {dateRange.from})
              </span>
            )}
          </label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => handleDateTo(e.target.value)}
            min={dateRange.from || undefined}
            className={`${selectClass} ${dateRangeError ? "border-red-500" : ""}`}
            aria-invalid={dateRangeError}
            aria-describedby={dateRangeError ? "date-range-error" : undefined}
          />
          {dateRangeError && (
            <p id="date-range-error" className="text-red-400 text-xs mt-1">
              {t("reports.filter.dateRangeError")}
            </p>
          )}
        </div>

        {/* Module-specific filters */}
        {activeModule === "customers" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
            <select
              value={filters.customers.status}
              onChange={(e) =>
                onFilterChange("customers", "status", e.target.value as CustomerStatus | "")
              }
              className={selectClass}
            >
              <option value="">{t("reports.filter.all")}</option>
              <option value="active">{t("reports.status.active")}</option>
              <option value="inactive">{t("reports.status.inactive")}</option>
              <option value="blacklisted">{t("reports.status.blacklisted")}</option>
            </select>
          </div>
        )}

        {activeModule === "requests" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
            <select
              value={filters.requests.status}
              onChange={(e) =>
                onFilterChange("requests", "status", e.target.value as LoanRequestStatus | "")
              }
              className={selectClass}
            >
              <option value="">{t("reports.filter.all")}</option>
              <option value="pending">{t("reports.status.pending")}</option>
              <option value="approved">{t("reports.status.approved")}</option>
              <option value="rejected">{t("reports.status.rejected")}</option>
              <option value="ready">{t("reports.status.ready")}</option>
              <option value="cancelled">{t("reports.status.cancelled")}</option>
            </select>
          </div>
        )}

        {activeModule === "loans" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.status")}
              </label>
              <select
                value={filters.loans.status}
                onChange={(e) =>
                  onFilterChange("loans", "status", e.target.value as LoanStatus | "")
                }
                className={selectClass}
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="active">{t("reports.status.active")}</option>
                <option value="overdue">{t("reports.status.overdue")}</option>
                <option value="returned">{t("reports.status.returned")}</option>
                <option value="closed">{t("reports.status.closed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.customer")}
              </label>
              <select
                value={filters.loans.customerId}
                onChange={(e) => {
                  onFilterChange("loans", "customerId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-loans-customer"
              >
                <option value="">{t("reports.filter.all")}</option>
                {customersList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {formatCustomerName(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.location")}
              </label>
              <select
                value={filters.loans.locationId}
                onChange={(e) => {
                  onFilterChange("loans", "locationId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-loans-location"
              >
                <option value="">{t("reports.filter.all")}</option>
                {locationsList.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.loans.overdue}
                  onChange={(e) => onFilterChange("loans", "overdue", e.target.checked)}
                  className="w-4 h-4 text-yellow-400 bg-zinc-800 border-zinc-700 rounded"
                />
                {t("reports.filter.onlyOverdue")}
              </label>
            </div>
          </>
        )}

        {activeModule === "financial" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.status")}
              </label>
              <select
                value={filters.financial.status}
                onChange={(e) =>
                  onFilterChange("financial", "status", e.target.value as InvoiceStatus | "")
                }
                className={selectClass}
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="pending">{t("reports.status.pending")}</option>
                <option value="paid">{t("reports.status.paid")}</option>
                <option value="cancelled">{t("reports.status.cancelled")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.type")}</label>
              <select
                value={filters.financial.type}
                onChange={(e) =>
                  onFilterChange(
                    "financial",
                    "type",
                    e.target.value as "rental" | "damage" | "deposit" | "deposit_shortfall" | "",
                  )
                }
                className={selectClass}
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="rental">{t("reports.type.rental")}</option>
                <option value="damage">{t("reports.type.damage")}</option>
                <option value="deposit">{t("reports.type.deposit")}</option>
                <option value="deposit_shortfall">{t("reports.type.depositShortfall")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.customer")}
              </label>
              <select
                value={filters.financial.customerId}
                onChange={(e) => {
                  onFilterChange("financial", "customerId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-financial-customer"
              >
                <option value="">{t("reports.filter.all")}</option>
                {customersList.map((c) => (
                  <option key={c._id} value={c._id}>
                    {formatCustomerName(c)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.location")}
              </label>
              <select
                value={filters.financial.locationId}
                onChange={(e) => {
                  onFilterChange("financial", "locationId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-financial-location"
              >
                <option value="">{t("reports.filter.all")}</option>
                {locationsList.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.category")}
              </label>
              <select
                value={filters.financial.categoryId}
                onChange={(e) => {
                  onFilterChange("financial", "categoryId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-financial-category"
              >
                <option value="">{t("reports.filter.all")}</option>
                {categoriesList.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {activeModule === "inventory" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.instanceStatus")}
              </label>
              <select
                value={filters.inventory.status}
                onChange={(e) => onFilterChange("inventory", "status", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("reports.filter.allStatus")}</option>
                <option value="available">{t("reports.status.available")}</option>
                <option value="loaned">{t("reports.status.loaned")}</option>
                <option value="maintenance">{t("reports.status.maintenance")}</option>
                <option value="damaged">{t("reports.status.damaged")}</option>
                <option value="retired">{t("reports.status.retired")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.location")}
              </label>
              <select
                value={filters.inventory.locationId}
                onChange={(e) => {
                  onFilterChange("inventory", "locationId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-inventory-location"
              >
                <option value="">{t("reports.filter.all")}</option>
                {locationsList.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.category")}
              </label>
              <select
                value={filters.inventory.categoryId}
                onChange={(e) => {
                  onFilterChange("inventory", "categoryId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-inventory-category"
              >
                <option value="">{t("reports.filter.all")}</option>
                {categoriesList.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.search")}
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  value={filters.inventory.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("reports.filter.searchPlaceholder")}
                  className={`${selectClass} pl-8 ${searchError ? "border-red-500 bg-red-500/10" : ""}`}
                  aria-invalid={!!searchError}
                  aria-describedby={searchError ? "search-error" : undefined}
                  data-help-id="reports-filter-inventory-search"
                />
              </div>
              {searchError && (
                <p id="search-error" className="text-red-400 text-xs mt-1">
                  {t("reports.filter.searchTooLong")}
                </p>
              )}
            </div>
          </>
        )}

        {activeModule === "team" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
            <select
              value={filters.team.status}
              onChange={(e) => onFilterChange("team", "status", e.target.value)}
              className={selectClass}
            >
              <option value="">{t("reports.filter.all")}</option>
              <option value="active">{t("reports.status.active")}</option>
              <option value="inactive">{t("reports.status.inactive")}</option>
              <option value="invited">{t("reports.status.invited")}</option>
            </select>
          </div>
        )}

        {activeModule === "locations" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
            <select
              value={filters.locations.status}
              onChange={(e) => onFilterChange("locations", "status", e.target.value)}
              className={selectClass}
            >
              <option value="">{t("reports.filter.all")}</option>
              <option value="available">{t("reports.status.available")}</option>
              <option value="full_capacity">{t("reports.status.fullCapacity")}</option>
              <option value="maintenance">{t("reports.status.maintenance")}</option>
              <option value="inactive">{t("reports.status.inactive")}</option>
            </select>
          </div>
        )}

        {activeModule === "orders" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
            <select
              value={filters.orders.status}
              onChange={(e) =>
                onFilterChange(
                  "orders",
                  "status",
                  e.target.value as
                    | "pending"
                    | "confirmed"
                    | "in-progress"
                    | "completed"
                    | "cancelled"
                    | "",
                )
              }
              className={selectClass}
            >
              <option value="">{t("reports.filter.all")}</option>
              <option value="pending">{t("reports.status.pending")}</option>
              <option value="confirmed">{t("reports.status.confirmed")}</option>
              <option value="in-progress">{t("reports.status.inProgress")}</option>
              <option value="completed">{t("reports.status.completed")}</option>
              <option value="cancelled">{t("reports.status.cancelled")}</option>
            </select>
          </div>
        )}

        {activeModule === "damages" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.status")}
              </label>
              <select
                value={filters.damages.status}
                onChange={(e) => onFilterChange("damages", "status", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="damaged">{t("reports.status.damaged")}</option>
                <option value="in_repair">{t("reports.status.inRepair")}</option>
                <option value="repaired">{t("reports.status.repaired")}</option>
                <option value="unrecoverable">{t("reports.status.unrecoverable")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.location")}
              </label>
              <select
                value={filters.damages.locationId}
                onChange={(e) => {
                  onFilterChange("damages", "locationId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-damages-location"
              >
                <option value="">{t("reports.filter.all")}</option>
                {locationsList.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.batchStatus")}
              </label>
              <select
                value={filters.damages.batchStatus}
                onChange={(e) => {
                  onFilterChange("damages", "batchStatus", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-damages-batchStatus"
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="pending">{t("reports.batchStatus.pending")}</option>
                <option value="in_progress">{t("reports.batchStatus.inProgress")}</option>
                <option value="completed">{t("reports.batchStatus.completed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.entryReason")}
              </label>
              <select
                value={filters.damages.entryReason}
                onChange={(e) => {
                  onFilterChange("damages", "entryReason", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-damages-entryReason"
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="damaged">{t("reports.entryReason.damaged")}</option>
                <option value="lost">{t("reports.entryReason.lost")}</option>
                <option value="other">{t("reports.entryReason.other")}</option>
              </select>
            </div>
          </>
        )}

        {activeModule === "transfers" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.status")}
              </label>
              <select
                value={filters.transfers.status}
                onChange={(e) =>
                  onFilterChange("transfers", "status", e.target.value as TransferStatus | "")
                }
                className={selectClass}
              >
                <option value="">{t("reports.filter.all")}</option>
                <option value="pending">{t("reports.status.pending")}</option>
                <option value="in_transit">{t("reports.status.inTransit")}</option>
                <option value="completed">{t("reports.status.completed")}</option>
                <option value="cancelled">{t("reports.status.cancelled")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.fromLocation")}
              </label>
              <select
                value={filters.transfers.fromLocationId}
                onChange={(e) => {
                  onFilterChange("transfers", "fromLocationId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-transfers-fromLocation"
              >
                <option value="">{t("reports.filter.all")}</option>
                {locationsList.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {t("reports.filter.toLocation")}
              </label>
              <select
                value={filters.transfers.toLocationId}
                onChange={(e) => {
                  onFilterChange("transfers", "toLocationId", e.target.value);
                  onPageReset();
                }}
                className={selectClass}
                data-help-id="reports-filter-transfers-toLocation"
              >
                <option value="">{t("reports.filter.all")}</option>
                {locationsList.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Clear dates */}
        {(dateRange.from || dateRange.to) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                onDateRangeChange({ from: "", to: "" });
                onPageReset();
              }}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition"
            >
              {t("reports.filter.clearDates")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
