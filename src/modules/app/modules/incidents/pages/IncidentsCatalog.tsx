import React, { useState } from "react";
import { Plus, Search, RefreshCcw, Eye } from "lucide-react";
import { useIncidents } from "../hooks/useIncidents";
import { CreateIncidentModal } from "../components/CreateIncidentModal";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import {
  LoadingSpinner,
  ErrorDisplay,
  EmptyState,
  StatusBadge,
  Pagination,
} from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useToast } from "../../../../../hooks/useToast";
import type {
  Incident,
  IncidentStatus,
  IncidentType,
  IncidentSeverity,
  IncidentContext,
  IncidentQueryParams,
} from "../../../../../types/api";

/**
 * Incidents Catalog — Main page for managing incident reports across
 * loans, transit, storage, maintenance, and other operational contexts.
 */
export const IncidentsCatalog: React.FC = () => {
  const { t, formatDate } = useLanguage();
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "">("");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "">("");
  const [contextFilter, setContextFilter] = useState<IncidentContext | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  const buildParams = (): IncidentQueryParams => {
    const params: IncidentQueryParams = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    if (severityFilter) params.severity = severityFilter;
    if (contextFilter) params.context = contextFilter;
    return params;
  };

  const {
    incidents,
    total,
    page,
    totalPages,
    loading,
    error,
    setPage,
    setFilters,
    addIncident,
    acknowledge,
    resolve,
    dismiss,
    refetch,
  } = useIncidents(buildParams());

  const [showCreate, setShowCreate] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const canCreate = hasPermission("incidents:create");
  const canUpdate = hasPermission("incidents:update");

  const applyFilters = () => {
    setPage(1);
    setFilters(buildParams());
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const loanIdStr =
      inc.loanId == null
        ? ""
        : typeof inc.loanId === "object"
          ? inc.loanId._id
          : String(inc.loanId);
    return (
      inc._id.toLowerCase().includes(term) ||
      loanIdStr.toLowerCase().includes(term) ||
      inc.description?.toLowerCase().includes(term)
    );
  });

  const openCount = incidents.filter((i) => i.status === "open").length;

  if (loading && incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        data-help-id="incidents-header"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t("incidents.title")} <span className="text-[#FFD700]">{t("incidents.hub")}</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">{t("incidents.subtitle")}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("incidents.open")}
            </p>
            <p className="text-2xl font-black text-[#FFD700]">{openCount}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("incidents.total")}
            </p>
            <p className="text-2xl font-black text-white">{total}</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[#FFD700] text-black font-bold text-sm rounded-xl hover:bg-[#e6c200] transition-colors"
              data-help-id="incidents-create-btn"
            >
              <Plus size={18} />
              {t("incidents.report")}
            </button>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title={t("incidents.refresh")}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col md:flex-row items-start md:items-end gap-4 border-b border-[#222] pb-6"
        data-help-id="incidents-filters"
      >
        <div className="flex-1 flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("incidents.context")}
            </label>
            <select
              value={contextFilter}
              onChange={(e) => {
                setContextFilter(e.target.value as IncidentContext | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              data-help-id="incidents-context-filter"
            >
              <option value="">{t("incidents.filterAll")}</option>
              <option value="loan">{t("incidents.contexts.loan")}</option>
              <option value="transit">{t("incidents.contexts.transit")}</option>
              <option value="storage">{t("incidents.contexts.storage")}</option>
              <option value="maintenance">{t("incidents.contexts.maintenance")}</option>
              <option value="other">{t("incidents.contexts.other")}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("incidents.status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as IncidentStatus | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">{t("incidents.filterAll")}</option>
              <option value="open">{t("incidents.statuses.open")}</option>
              <option value="acknowledged">{t("incidents.statuses.acknowledged")}</option>
              <option value="resolved">{t("incidents.statuses.resolved")}</option>
              <option value="dismissed">{t("incidents.statuses.dismissed")}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("incidents.type")}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as IncidentType | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">{t("incidents.filterAll")}</option>
              <option value="damage">{t("incidents.types.damage")}</option>
              <option value="lost">{t("incidents.types.lost")}</option>
              <option value="overdue">{t("incidents.types.overdue")}</option>
              <option value="issue">{t("incidents.types.issue")}</option>
              <option value="replacement">{t("incidents.types.replacement")}</option>
              <option value="extended">{t("incidents.types.extended")}</option>
              <option value="other">{t("incidents.types.other")}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("incidents.severity")}
            </label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as IncidentSeverity | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">{t("incidents.filterAll")}</option>
              <option value="low">{t("incidents.severities.low")}</option>
              <option value="medium">{t("incidents.severities.medium")}</option>
              <option value="high">{t("incidents.severities.high")}</option>
              <option value="critical">{t("incidents.severities.critical")}</option>
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
          <input
            type="text"
            placeholder={t("incidents.searchPlaceholder")}
            className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl"
        data-help-id="incidents-table"
      >
        {filteredIncidents.length === 0 ? (
          <EmptyState
            title={t("incidents.noIncidents")}
            description={t("incidents.noIncidentsDescription")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#222] bg-[#0d0d0d]">
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.context")}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.type")}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.status")}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.severity")}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.sourceType")}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.description")}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.date")}
                  </th>
                  <th className="py-4 px-6 text-right text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {t("incidents.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {filteredIncidents.map((inc) => (
                  <tr
                    key={inc._id}
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <td className="py-4 px-6">
                      {inc.context ? (
                        <StatusBadge status={t(`incidents.contexts.${inc.context}`)} />
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-white font-medium">
                        {t(`incidents.types.${inc.type}`)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={inc.severity} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-400 capitalize">
                        {t(`incidents.sourceTypes.${inc.sourceType}`)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-300 truncate max-w-[200px]">
                        {inc.description || t("incidents.noDescription")}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-500 font-mono">
                        {formatDate(inc.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                        className="p-2 text-gray-500 hover:text-[#FFD700] hover:bg-[#222] rounded-lg transition-colors"
                        title={t("incidents.viewDetails")}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-[#222]" data-help-id="incidents-pagination">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateIncidentModal
          onClose={() => setShowCreate(false)}
          onSave={async (payload) => {
            await addIncident(payload);
            showToast("success", t("incidents.reported"));
            setShowCreate(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          canUpdate={canUpdate}
          onClose={() => setSelectedIncident(null)}
          onAcknowledge={async (id: string) => {
            await acknowledge(id);
            setSelectedIncident(null);
            showToast("success", t("incidents.acknowledged"));
          }}
          onResolve={async (id: string, resolution: string) => {
            await resolve(id, { resolution });
            setSelectedIncident(null);
            showToast("success", t("incidents.resolved"));
          }}
          onDismiss={async (id: string, resolution: string) => {
            await dismiss(id, { resolution });
            setSelectedIncident(null);
            showToast("success", t("incidents.dismissed"));
          }}
        />
      )}
    </div>
  );
};
