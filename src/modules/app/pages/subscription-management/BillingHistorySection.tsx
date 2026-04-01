import { useMemo, useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { AdminPagination, AdminTable } from "../../components";
import { formatEventType, formatCurrency, formatDate } from "./helpers";
import { EVENT_TYPE_BADGE, EVENT_TYPE_ICON, HISTORY_PAGE_SIZE, HISTORY_PREFS_KEY } from "./types";
import type { HistorySortField, HistorySortDirection } from "./types";
import type { BillingHistoryEntry } from "../../../../types/api";

interface BillingHistorySectionProps {
  /** Full billing history entries. */
  history: BillingHistoryEntry[];
  /** Whether the current language is Spanish. */
  isEs: boolean;
  /** Locale string for formatting (e.g. "en-US"). */
  locale: string;
}

export default function BillingHistorySection({
  history,
  isEs,
  locale,
}: BillingHistorySectionProps) {
  // ─── Lazy-initialise state from persisted preferences ───────────────────
  const storedPrefs = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(HISTORY_PREFS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as {
        search?: string;
        eventFilter?: string;
        sortField?: HistorySortField;
        sortDirection?: HistorySortDirection;
      };
    } catch {
      return null;
    }
  }, []);

  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState(() =>
    typeof storedPrefs?.search === "string" ? storedPrefs.search : "",
  );
  const [historyEventFilter, setHistoryEventFilter] = useState(() =>
    typeof storedPrefs?.eventFilter === "string" ? storedPrefs.eventFilter : "",
  );
  const [historySortField, setHistorySortField] = useState<HistorySortField>(() =>
    storedPrefs?.sortField && ["date", "event", "amount"].includes(storedPrefs.sortField)
      ? storedPrefs.sortField
      : "date",
  );
  const [historySortDirection, setHistorySortDirection] = useState<HistorySortDirection>(() =>
    storedPrefs?.sortDirection && ["asc", "desc"].includes(storedPrefs.sortDirection)
      ? storedPrefs.sortDirection
      : "desc",
  );

  // ─── Persist preferences ────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      HISTORY_PREFS_KEY,
      JSON.stringify({
        search: historySearch,
        eventFilter: historyEventFilter,
        sortField: historySortField,
        sortDirection: historySortDirection,
      }),
    );
  }, [historySearch, historyEventFilter, historySortField, historySortDirection]);

  // ─── Derived data ───────────────────────────────────────────────────────

  const historyEventOptions = useMemo(
    () => Array.from(new Set(history.map((entry) => entry.eventType))).sort(),
    [history],
  );

  const filteredHistory = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLowerCase();

    return history.filter((entry) => {
      if (historyEventFilter && entry.eventType !== historyEventFilter) return false;
      if (!normalizedSearch) return true;

      const searchable = [
        formatEventType(entry.eventType),
        entry.newPlan ?? "",
        formatDate(entry.createdAt, locale),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [history, historySearch, historyEventFilter, locale]);

  const sortedHistory = useMemo(() => {
    const cloned = [...filteredHistory];

    cloned.sort((a, b) => {
      if (historySortField === "event") {
        const comparison = formatEventType(a.eventType).localeCompare(formatEventType(b.eventType));
        return historySortDirection === "asc" ? comparison : -comparison;
      }

      if (historySortField === "amount") {
        const amountA = a.amount ?? 0;
        const amountB = b.amount ?? 0;
        const comparison = amountA - amountB;
        return historySortDirection === "asc" ? comparison : -comparison;
      }

      const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return historySortDirection === "asc" ? comparison : -comparison;
    });

    return cloned;
  }, [filteredHistory, historySortField, historySortDirection]);

  const historyTotalPages = Math.max(1, Math.ceil(sortedHistory.length / HISTORY_PAGE_SIZE));
  const pagedHistory = sortedHistory.slice(
    (historyPage - 1) * HISTORY_PAGE_SIZE,
    historyPage * HISTORY_PAGE_SIZE,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard pagination clamp
    setHistoryPage((prev) => Math.min(prev, historyTotalPages));
  }, [historyTotalPages]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset to first page when filters change
    setHistoryPage(1);
  }, [historySearch, historyEventFilter, historySortField, historySortDirection]);

  // ─── Sort helpers ───────────────────────────────────────────────────────

  const handleHistorySort = useCallback(
    (field: HistorySortField) => {
      if (historySortField === field) {
        setHistorySortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        return;
      }
      setHistorySortField(field);
      setHistorySortDirection(field === "date" ? "desc" : "asc");
    },
    [historySortField],
  );

  const renderSortIcon = (field: HistorySortField) => {
    if (historySortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return historySortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] border border-[#333] rounded-xl p-4 sm:p-6">
      <div className="mb-4 pb-4 border-b border-[#333] flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {isEs ? "Historial de facturacion" : "Billing History"}
        </h2>
        <span className="badge badge-info">
          {filteredHistory.length} {isEs ? "de" : "of"} {history.length}{" "}
          {isEs ? "registros" : "records"}
        </span>
      </div>

      <div className="card-compact mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder={
                isEs ? "Buscar evento, plan o fecha..." : "Search event, plan, or date..."
              }
              className="input pl-10"
            />
          </div>
          <select
            value={historyEventFilter}
            onChange={(e) => setHistoryEventFilter(e.target.value)}
            className="input"
            title={isEs ? "Filtrar por tipo de evento" : "Filter by event type"}
            aria-label={
              isEs
                ? "Filtrar historial de facturacion por tipo de evento"
                : "Filter billing history by event type"
            }
          >
            <option value="">{isEs ? "Todos los eventos" : "All events"}</option>
            {historyEventOptions.map((eventType) => (
              <option key={eventType} value={eventType}>
                {formatEventType(eventType)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <AdminTable>
          <thead className="bg-[#0f0f0f] border-b border-[#333]">
            <tr>
              <th className="px-6 py-3 text-gray-400 font-medium">
                <button
                  type="button"
                  onClick={() => handleHistorySort("date")}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  {isEs ? "Fecha" : "Date"}
                  {renderSortIcon("date")}
                </button>
              </th>
              <th className="px-6 py-3 text-gray-400 font-medium">
                <button
                  type="button"
                  onClick={() => handleHistorySort("event")}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  {isEs ? "Evento" : "Event"}
                  {renderSortIcon("event")}
                </button>
              </th>
              <th className="px-6 py-3 text-gray-400 font-medium">
                {isEs ? "Plan / Asientos" : "Plan / Seats"}
              </th>
              <th className="px-6 py-3 text-gray-400 font-medium text-right">
                <button
                  type="button"
                  onClick={() => handleHistorySort("amount")}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  {isEs ? "Monto" : "Amount"}
                  {renderSortIcon("amount")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  {isEs
                    ? "No hay historial de facturacion disponible para los filtros seleccionados."
                    : "No billing history available for the selected filters."}
                </td>
              </tr>
            ) : (
              pagedHistory.map((entry) => (
                <tr
                  key={entry._id}
                  className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
                >
                  <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                    {formatDate(entry.createdAt, locale)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        EVENT_TYPE_BADGE[entry.eventType] ??
                        "bg-gray-800 text-gray-400 border border-gray-600"
                      }`}
                    >
                      {EVENT_TYPE_ICON[entry.eventType] ?? <CreditCard size={14} />}
                      {formatEventType(entry.eventType)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-300">
                    {entry.newPlan ? <span className="capitalize">{entry.newPlan}</span> : null}
                    {entry.newPlan && entry.seatChange != null ? " · " : null}
                    {entry.seatChange != null ? (
                      <span className="text-gray-400">
                        {entry.seatChange} {isEs ? "asiento" : "seat"}
                        {entry.seatChange !== 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {!entry.newPlan && entry.seatChange == null ? (
                      <span className="text-gray-600">—</span>
                    ) : null}
                  </td>
                  <td className="px-6 py-3 text-white font-medium text-right whitespace-nowrap">
                    {entry.amount != null && entry.amount > 0 ? (
                      formatCurrency(entry.amount, entry.currency, locale)
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </AdminTable>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {filteredHistory.length === 0 ? (
          <div className="card p-5 text-center text-gray-500">
            {isEs
              ? "No hay historial de facturacion disponible para los filtros seleccionados."
              : "No billing history available for the selected filters."}
          </div>
        ) : (
          pagedHistory.map((entry) => (
            <div key={entry._id} className="card-compact">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-gray-500">{formatDate(entry.createdAt, locale)}</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    EVENT_TYPE_BADGE[entry.eventType] ??
                    "bg-gray-800 text-gray-400 border border-gray-600"
                  }`}
                >
                  {EVENT_TYPE_ICON[entry.eventType] ?? <CreditCard size={14} />}
                  {formatEventType(entry.eventType)}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-1">
                {entry.newPlan ? <span className="capitalize">{entry.newPlan}</span> : "—"}
                {entry.seatChange != null ? (
                  <span className="text-gray-500">
                    {" "}
                    · {entry.seatChange} {isEs ? "asientos" : "seats"}
                  </span>
                ) : null}
              </p>
              <p className="text-sm font-semibold text-white">
                {entry.amount != null && entry.amount > 0
                  ? formatCurrency(entry.amount, entry.currency, locale)
                  : "—"}
              </p>
            </div>
          ))
        )}
      </div>

      <AdminPagination
        currentPage={historyPage}
        totalPages={historyTotalPages}
        totalItems={sortedHistory.length}
        pageSize={HISTORY_PAGE_SIZE}
        itemLabel={isEs ? "registros" : "records"}
        onPageChange={setHistoryPage}
      />
    </div>
  );
}
