import { Filter } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
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

  const handleDateFrom = (value: string) => {
    onDateRangeChange({ ...dateRange, from: value });
    onPageReset();
  };

  const handleDateTo = (value: string) => {
    onDateRangeChange({ ...dateRange, to: value });
    onPageReset();
  };

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
            className={selectClass}
          />
        </div>
        {/* Date To */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.to")}</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => handleDateTo(e.target.value)}
            className={selectClass}
          />
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
          </>
        )}

        {activeModule === "inventory" && (
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
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
            <select
              value={filters.damages.status}
              onChange={(e) => onFilterChange("damages", "status", e.target.value)}
              className={selectClass}
            >
              <option value="">{t("reports.filter.all")}</option>
              <option value="damaged">{t("reports.status.damaged")}</option>
            </select>
          </div>
        )}

        {activeModule === "transfers" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">{t("reports.filter.status")}</label>
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
