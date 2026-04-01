import { Filter } from "lucide-react";
import type {
  ReportModule,
  DateRange,
  ModuleFilters,
  CustomerStatus,
  LoanRequestStatus,
  LoanStatus,
  InvoiceStatus,
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
  isEs: boolean;
}

export function ReportsFilters({
  activeModule,
  dateRange,
  onDateRangeChange,
  filters,
  onFilterChange,
  onPageReset,
  isEs,
}: ReportsFiltersProps) {
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
        <span className="text-sm font-semibold text-gray-300">{isEs ? "Filtros" : "Filters"}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{isEs ? "Desde" : "From"}</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => handleDateFrom(e.target.value)}
            className={selectClass}
          />
        </div>
        {/* Date To */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">{isEs ? "Hasta" : "To"}</label>
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
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={filters.customers.status}
              onChange={(e) =>
                onFilterChange("customers", "status", e.target.value as CustomerStatus | "")
              }
              className={selectClass}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
        )}

        {activeModule === "requests" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={filters.requests.status}
              onChange={(e) =>
                onFilterChange("requests", "status", e.target.value as LoanRequestStatus | "")
              }
              className={selectClass}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="ready">Ready</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {activeModule === "loans" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.loans.status}
                onChange={(e) =>
                  onFilterChange("loans", "status", e.target.value as LoanStatus | "")
                }
                className={selectClass}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
                <option value="returned">Returned</option>
                <option value="closed">Closed</option>
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
                Only overdue
              </label>
            </div>
          </>
        )}

        {activeModule === "invoices" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                value={filters.invoices.status}
                onChange={(e) =>
                  onFilterChange("invoices", "status", e.target.value as InvoiceStatus | "")
                }
                className={selectClass}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={filters.invoices.type}
                onChange={(e) =>
                  onFilterChange(
                    "invoices",
                    "type",
                    e.target.value as "rental" | "damage" | "deposit" | "",
                  )
                }
                className={selectClass}
              >
                <option value="">All</option>
                <option value="rental">Rental</option>
                <option value="damage">Damage</option>
                <option value="deposit">Deposit</option>
              </select>
            </div>
          </>
        )}

        {activeModule === "inventory" && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">View Type</label>
              <select
                value={filters.inventory.type}
                onChange={(e) =>
                  onFilterChange(
                    "inventory",
                    "type",
                    e.target.value as "types" | "categories" | "instances" | "",
                  )
                }
                className={selectClass}
              >
                <option value="">Material Instances (Default)</option>
                <option value="instances">Material Instances</option>
                <option value="types">Material Types</option>
                <option value="categories">Categories</option>
              </select>
            </div>
            {(filters.inventory.type === "" || filters.inventory.type === "instances") && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Instance Status</label>
                <select
                  value={filters.inventory.status}
                  onChange={(e) => onFilterChange("inventory", "status", e.target.value)}
                  className={selectClass}
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="loaned">Loaned</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="damaged">Damaged</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            )}
          </>
        )}

        {activeModule === "team" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={filters.team.status}
              onChange={(e) => onFilterChange("team", "status", e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="invited">Invited</option>
            </select>
          </div>
        )}

        {activeModule === "locations" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={filters.locations.status}
              onChange={(e) => onFilterChange("locations", "status", e.target.value)}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="full_capacity">Full Capacity</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}

        {activeModule === "orders" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Order Status</label>
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
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {/* Clear filters */}
        {(dateRange.from || dateRange.to) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                onDateRangeChange({ from: "", to: "" });
                onPageReset();
              }}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition underline"
            >
              {isEs ? "Limpiar fechas" : "Clear dates"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
