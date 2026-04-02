import React, { useState } from "react";
import { Plus, Search, RefreshCcw, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useIncidents } from "../hooks/useIncidents";
import { CreateIncidentModal } from "../components/CreateIncidentModal";
import { IncidentDetailModal } from "../components/IncidentDetailModal";
import { LoadingSpinner, ErrorDisplay, EmptyState } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useToast } from "../../../../../hooks/useToast";
import type {
  Incident,
  IncidentStatus,
  IncidentType,
  IncidentSeverity,
  IncidentQueryParams,
} from "../../../../../types/api";

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: "bg-red-900/30 text-red-300 border-red-500/30",
  acknowledged: "bg-amber-900/30 text-amber-300 border-amber-500/30",
  resolved: "bg-green-900/30 text-green-300 border-green-500/30",
  dismissed: "bg-gray-800/30 text-gray-400 border-gray-600/30",
};

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: "bg-blue-900/30 text-blue-300 border-blue-500/30",
  medium: "bg-amber-900/30 text-amber-300 border-amber-500/30",
  high: "bg-orange-900/30 text-orange-300 border-orange-500/30",
  critical: "bg-red-900/30 text-red-300 border-red-500/30",
};

const TYPE_LABELS: Record<IncidentType, { en: string; es: string }> = {
  damage: { en: "Damage", es: "Daño" },
  lost: { en: "Lost", es: "Perdido" },
  overdue: { en: "Overdue", es: "Vencido" },
  issue: { en: "Issue", es: "Problema" },
  replacement: { en: "Replacement", es: "Reemplazo" },
  extended: { en: "Extended", es: "Extendido" },
  other: { en: "Other", es: "Otro" },
};

/**
 * Incidents Catalog — Main page for managing incident reports linked to loans.
 */
export const IncidentsCatalog: React.FC = () => {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "">("");
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "">("");
  const [searchTerm, setSearchTerm] = useState("");

  const buildParams = (): IncidentQueryParams => {
    const params: IncidentQueryParams = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    if (severityFilter) params.severity = severityFilter;
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
    const loanIdStr = typeof inc.loanId === "object" ? inc.loanId._id : String(inc.loanId);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {isEs ? "Novedades" : "Incidents"}{" "}
            <span className="text-[#FFD700]">{isEs ? "Centro" : "Hub"}</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            {isEs
              ? "Gestiona reportes de daños, pérdidas y otros eventos de los préstamos."
              : "Manage damage, loss, and other notable events from loans."}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {isEs ? "Abiertas" : "Open"}
            </p>
            <p className="text-2xl font-black text-[#FFD700]">{openCount}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {isEs ? "Total" : "Total"}
            </p>
            <p className="text-2xl font-black text-white">{total}</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[#FFD700] text-black font-bold text-sm rounded-xl hover:bg-[#e6c200] transition-colors"
            >
              <Plus size={18} />
              {isEs ? "Reportar" : "Report"}
            </button>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title={isEs ? "Actualizar" : "Refresh"}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 border-b border-[#222] pb-6">
        <div className="flex-1 flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {isEs ? "Estado" : "Status"}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as IncidentStatus | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">{isEs ? "Todos" : "All"}</option>
              <option value="open">{isEs ? "Abierto" : "Open"}</option>
              <option value="acknowledged">{isEs ? "Reconocido" : "Acknowledged"}</option>
              <option value="resolved">{isEs ? "Resuelto" : "Resolved"}</option>
              <option value="dismissed">{isEs ? "Descartado" : "Dismissed"}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {isEs ? "Tipo" : "Type"}
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as IncidentType | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">{isEs ? "Todos" : "All"}</option>
              {(Object.keys(TYPE_LABELS) as IncidentType[]).map((t) => (
                <option key={t} value={t}>
                  {isEs ? TYPE_LABELS[t].es : TYPE_LABELS[t].en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {isEs ? "Severidad" : "Severity"}
            </label>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as IncidentSeverity | "");
                setTimeout(applyFilters, 0);
              }}
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">{isEs ? "Todos" : "All"}</option>
              <option value="low">{isEs ? "Baja" : "Low"}</option>
              <option value="medium">{isEs ? "Media" : "Medium"}</option>
              <option value="high">{isEs ? "Alta" : "High"}</option>
              <option value="critical">{isEs ? "Crítica" : "Critical"}</option>
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
          <input
            type="text"
            placeholder={isEs ? "Buscar por ID o descripción..." : "Search by ID or description..."}
            className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        {filteredIncidents.length === 0 ? (
          <EmptyState
            title={isEs ? "Sin novedades" : "No incidents"}
            description={
              isEs
                ? "No se encontraron novedades con los filtros actuales."
                : "No incidents found with the current filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#222] bg-[#0d0d0d]">
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Tipo" : "Type"}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Estado" : "Status"}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Severidad" : "Severity"}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Origen" : "Source"}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Descripción" : "Description"}
                  </th>
                  <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Fecha" : "Date"}
                  </th>
                  <th className="py-4 px-6 text-right text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {isEs ? "Acciones" : "Actions"}
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
                      <span className="text-sm text-white font-medium">
                        {isEs ? TYPE_LABELS[inc.type].es : TYPE_LABELS[inc.type].en}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[inc.status]}`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${SEVERITY_COLORS[inc.severity]}`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-400 capitalize">{inc.sourceType}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-300 truncate max-w-[200px]">
                        {inc.description || (isEs ? "Sin descripción" : "No description")}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-500 font-mono">
                        {new Date(inc.createdAt).toLocaleDateString(isEs ? "es-CO" : "en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                        className="p-2 text-gray-500 hover:text-[#FFD700] hover:bg-[#222] rounded-lg transition-colors"
                        title={isEs ? "Ver detalles" : "View details"}
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#222]">
            <p className="text-xs text-gray-500">
              {isEs ? `Página ${page} de ${totalPages}` : `Page ${page} of ${totalPages}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-[#222] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-[#222] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateIncidentModal
          isEs={isEs}
          onClose={() => setShowCreate(false)}
          onSave={async (payload) => {
            await addIncident(payload);
            showToast(
              "success",
              isEs ? "Novedad reportada exitosamente" : "Incident reported successfully",
            );
            setShowCreate(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          isEs={isEs}
          canUpdate={canUpdate}
          onClose={() => setSelectedIncident(null)}
          onAcknowledge={async (id: string) => {
            await acknowledge(id);
            setSelectedIncident(null);
            showToast("success", isEs ? "Novedad reconocida" : "Incident acknowledged");
          }}
          onResolve={async (id: string, resolution: string) => {
            await resolve(id, { resolution });
            setSelectedIncident(null);
            showToast("success", isEs ? "Novedad resuelta" : "Incident resolved");
          }}
          onDismiss={async (id: string, resolution: string) => {
            await dismiss(id, { resolution });
            setSelectedIncident(null);
            showToast("success", isEs ? "Novedad descartada" : "Incident dismissed");
          }}
        />
      )}
    </div>
  );
};
