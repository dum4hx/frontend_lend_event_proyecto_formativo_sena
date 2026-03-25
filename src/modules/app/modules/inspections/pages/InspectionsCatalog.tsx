import React, { useState } from "react";
import { ClipboardCheck, History, Search, RefreshCcw } from "lucide-react";
import { useInspections } from "../hooks/useInspections";
import {
  PendingLoansTable,
  CompletedInspectionsTable,
  InspectionFormModal,
  InspectionDetailModal,
} from "../components";
import { LoadingSpinner, ErrorDisplay } from "../../../../../components/ui";
import type { PendingLoan, Inspection } from "../../../../../types/api";

/**
 * Inspections Catalog — Main dashboard for Warehouse Operator to manage loan returns.
 * High-impact UI with tabs, metrics, and real-time list updates.
 */
export const InspectionsCatalog: React.FC = () => {
  const { inspections, pendingLoans, loading, error, recordInspection, refetch } = useInspections();

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedLoan, setSelectedLoan] = useState<PendingLoan | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPending = pendingLoans.filter(
    (l) =>
      l._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.customerId.name.firstName + " " + l.customerId.name.firstSurname)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const filteredHistory = inspections.filter((i) => {
    const loanIdStr = typeof i.loanId === "string" ? i.loanId : (i.loanId as { _id: string })._id;
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

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Inspections <span className="text-[#FFD700]">Hub</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            Assess material status upon return and automatically generate damage invoices for
            customers.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              Pending Tasks
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

      {/* Tabs & Filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-1">
          <div className="flex space-x-10">
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-4 text-sm font-bold tracking-wide transition-all relative ${
                activeTab === "pending" ? "text-[#FFD700]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div className="flex items-center">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Pending Inspections
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
                Completed History
              </div>
              {activeTab === "history" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFD700] rounded-t-full shadow-[0_-2px_6px_rgba(255,215,0,0.4)]" />
              )}
            </button>
          </div>

          <div className="relative w-full md:w-80 group mb-2">
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
        <div className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
          {activeTab === "pending" ? (
            <PendingLoansTable loans={filteredPending} onInspect={setSelectedLoan} />
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
          onSave={recordInspection}
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
