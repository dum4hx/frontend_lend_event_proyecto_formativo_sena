import React, { useState } from "react";
import { ClipboardCheck, History, Search, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../../hooks/useActionPermission";
import Unauthorized from "../../../../../pages/Unauthorized";
import { useInspections } from "../hooks/useInspections";
import {
  PendingLoansTable,
  CompletedInspectionsTable,
  InspectionFormModal,
  InspectionDetailModal,
} from "../components";
import { LoadingSpinner, ErrorDisplay } from "../../../../../components/ui";
import type {
  PendingLoan,
  InspectionListItem,
  Inspection,
  CreateInspectionPayload,
} from "../../../../../types/api";

/**
 * Inspections Catalog — Main dashboard for Warehouse Operator to manage loan returns.
 * High-impact UI with tabs, metrics, and real-time list updates.
 */
export const InspectionsCatalog: React.FC = () => {
  const { t } = useLanguage();
  const { hasPermission } = usePermissions();
  const { guard } = useActionPermission("en");
  const { inspections, pendingLoans, loading, error, recordInspection, refetch } = useInspections();

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedLoan, setSelectedLoan] = useState<PendingLoan | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionListItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successNotification, setSuccessNotification] = useState<{
    inspectionNumber: string;
  } | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  const handleSaveInspection = async (payload: CreateInspectionPayload): Promise<Inspection> => {
    try {
      const inspection = (await recordInspection(payload)) as Inspection;
      setSuccessNotification({ inspectionNumber: inspection.inspectionNumber ?? inspection._id });
      setActiveTab("history");
      return inspection;
    } catch (err) {
      setErrorNotification((err as Error).message ?? t("inspections.saveFailed"));
      throw err;
    }
  };

  const filteredPending = pendingLoans.filter(
    (l) =>
      l._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${l.customerId.name.firstName} ${l.customerId.name.firstSurname}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const filteredHistory = inspections.filter((i) => {
    const loanIdStr = typeof i.loanId === "string" ? i.loanId : i.loanId._id;
    return (
      i._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loanIdStr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading && pendingLoans.length === 0 && inspections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!hasPermission("inspections:read")) return <Unauthorized />;

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div data-help-id="inspections-title">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t("inspections.title")} <span className="text-[#FFD700]">Hub</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">{t("inspections.description")}</p>
        </div>

        <div className="flex items-center space-x-4" data-help-id="inspections-stats">
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("inspections.tabPending")}
            </p>
            <p className="text-2xl font-black text-[#FFD700]">{pendingLoans.length}</p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title="Refresh lists"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notification Cards */}
      {successNotification && (
        <div className="flex items-start gap-3 bg-green-900/30 border border-green-500/40 text-green-200 p-4 rounded-xl shadow-lg animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-green-300">{t("inspections.saveSuccess")}</p>
            <p className="text-sm mt-1 text-green-400/80">
              {t("inspections.saveSuccessBody", { code: successNotification.inspectionNumber })}
            </p>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-green-500 hover:text-green-300 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorNotification && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-500/40 text-red-200 p-4 rounded-xl shadow-lg animate-in fade-in duration-300">
          <XCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-red-300">{t("inspections.saveFailed")}</p>
            <p className="text-sm mt-1 text-red-400/80">{errorNotification}</p>
          </div>
          <button
            onClick={() => setErrorNotification(null)}
            className="text-red-500 hover:text-red-300 transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs & Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-1">
          <div className="flex space-x-10" data-help-id="inspections-tabs">
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${
                activeTab === "pending" ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                {t("inspections.tabPending")}
              </div>
              {activeTab === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFD700] rounded-t-full shadow-[0_-2px_6px_rgba(255,215,0,0.4)]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${
                activeTab === "history" ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center">
                <History className="w-4 h-4 mr-2" />
                {t("inspections.tabCompleted")}
              </div>
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFD700] rounded-t-full shadow-[0_-2px_6px_rgba(255,215,0,0.4)]" />
              )}
            </button>
          </div>

          <div className="relative w-full md:w-80 group mb-2" data-help-id="inspections-search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
            <input
              type="text"
              placeholder="Filter by ID or customer..."
              className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all font-mono"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Content */}
        <div
          className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl"
          data-help-id="inspections-content"
        >
          {activeTab === "pending" ? (
            <PendingLoansTable
              loans={filteredPending}
              onInspect={(loan) =>
                guard("inspections:create", () => {
                  setSuccessNotification(null);
                  setErrorNotification(null);
                  setSelectedLoan(loan);
                })()
              }
            />
          ) : (
            <CompletedInspectionsTable
              inspections={filteredHistory}
              onView={setSelectedInspection}
            />
          )}

          {searchTerm &&
            (activeTab === "pending" ? filteredPending : filteredHistory).length === 0 && (
              <div className="p-20 text-center border-t border-[#222]">
                <p className="text-gray-500 text-sm">No results matching your filters.</p>
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      {selectedLoan && (
        <InspectionFormModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onSave={handleSaveInspection}
        />
      )}

      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
};
