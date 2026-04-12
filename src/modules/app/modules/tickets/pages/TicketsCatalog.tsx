import React, { useState } from "react";
import { Plus, Search, RefreshCcw } from "lucide-react";
import { useTickets } from "../hooks/useTickets";
import { TicketListTable } from "../components/TicketListTable";
import { TicketDetailModal } from "../components/TicketDetailModal";
import { TicketCreateModal } from "../components/TicketCreateModal";
import { TicketApproveModal } from "../components/TicketApproveModal";
import { TicketRejectModal } from "../components/TicketRejectModal";
import { LoadingSpinner, ErrorDisplay } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../../hooks/useActionPermission";
import { useToast } from "../../../../../hooks/useToast";
import Unauthorized from "../../../../../pages/Unauthorized";
import type {
  TicketListItem,
  TicketStatus,
  TicketType,
  Ticket,
  ApproveTicketPayload,
  RejectTicketPayload,
} from "../../../../../types/api";

const TICKET_STATUSES: TicketStatus[] = [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "cancelled",
  "expired",
];

const TICKET_TYPES: TicketType[] = [
  "transfer_request",
  "incident_report",
  "maintenance_request",
  "inspection_request",
  "generic",
];

/**
 * Main catalog page for the Tickets module.
 */
export const TicketsCatalog: React.FC = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = usePermissions();
  const { guard, isAllowed } = useActionPermission(language === "es" ? "es" : "en");
  const { showToast } = useToast();

  const {
    tickets,
    selectedTicket,
    pagination,
    loading,
    detailLoading,
    error,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    setPage,
    fetchDetail,
    clearSelectedTicket,
    createTicket,
    reviewTicket,
    approveTicket,
    rejectTicket,
    cancelTicket,
    refetch,
  } = useTickets();

  const [showCreate, setShowCreate] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketToAction, setTicketToAction] = useState<Ticket | null>(null);

  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return t.title.toLowerCase().includes(term) || t._id.toLowerCase().includes(term);
  });

  const pendingCount = tickets.filter((t) => t.status === "pending").length;

  const handleSelectTicket = async (item: TicketListItem) => {
    await fetchDetail(item._id);
  };

  const handleReview = async (id: string) => {
    try {
      await reviewTicket(id);
      showToast("success", t("tickets.toast.reviewed"), t("tickets.toast.reviewedTitle"));
    } catch (err) {
      showToast("error", (err as Error).message, t("tickets.toast.errorTitle"));
    }
  };

  const handleOpenApprove = (ticket: Ticket) => {
    setTicketToAction(ticket);
    setShowApprove(true);
  };

  const handleOpenReject = (ticket: Ticket) => {
    setTicketToAction(ticket);
    setShowReject(true);
  };

  const handleApprove = async (payload: ApproveTicketPayload) => {
    if (!ticketToAction) return;
    try {
      await approveTicket(ticketToAction._id, payload);
      showToast("success", t("tickets.toast.approved"), t("tickets.toast.approvedTitle"));
      setShowApprove(false);
      setTicketToAction(null);
    } catch (err) {
      showToast("error", (err as Error).message, t("tickets.toast.errorTitle"));
    }
  };

  const handleReject = async (payload: RejectTicketPayload) => {
    if (!ticketToAction) return;
    try {
      await rejectTicket(ticketToAction._id, payload);
      showToast("success", t("tickets.toast.rejected"), t("tickets.toast.rejectedTitle"));
      setShowReject(false);
      setTicketToAction(null);
    } catch (err) {
      showToast("error", (err as Error).message, t("tickets.toast.errorTitle"));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelTicket(id);
      showToast("success", t("tickets.toast.cancelled"), t("tickets.toast.cancelledTitle"));
    } catch (err) {
      showToast("error", (err as Error).message, t("tickets.toast.errorTitle"));
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetch} />;
  }

  if (!hasPermission("tickets:read")) return <Unauthorized />;

  return (
    <div className="p-6 md:p-10 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        data-help-id="tickets-header"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {t("tickets.title")}
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">{t("tickets.description")}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.status.pending")}
            </p>
            <p className="text-2xl font-black text-[#FFD700]">{pendingCount}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#222] px-6 py-3 rounded-xl shadow-lg">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("common.total")}
            </p>
            <p className="text-2xl font-black text-white">{pagination.total}</p>
          </div>
          <button
            onClick={guard("tickets:create", () => setShowCreate(true))}
            aria-disabled={!isAllowed("tickets:create")}
            className={`flex items-center gap-2 px-4 py-3 bg-[#FFD700] text-black font-bold text-sm rounded-xl hover:bg-[#e6c200] transition-colors ${!isAllowed("tickets:create") ? "opacity-50 cursor-not-allowed" : ""}`}
            data-help-id="tickets-create-btn"
          >
            <Plus size={18} />
            {t("tickets.create")}
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-3 bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white hover:border-[#444] rounded-xl transition-all disabled:opacity-50"
            title={t("common.refresh")}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col md:flex-row items-start md:items-end gap-4 border-b border-[#222] pb-6"
        data-help-id="tickets-filters"
      >
        <div className="flex-1 flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.status")}
            </label>
            <select
              value={statusFilter ?? ""}
              onChange={(e) =>
                setStatusFilter((e.target.value || undefined) as TicketStatus | undefined)
              }
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              data-help-id="tickets-status-filter"
            >
              <option value="">{t("tickets.allStatuses")}</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`tickets.status.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.type")}
            </label>
            <select
              value={typeFilter ?? ""}
              onChange={(e) =>
                setTypeFilter((e.target.value || undefined) as TicketType | undefined)
              }
              className="bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFD700]"
              data-help-id="tickets-type-filter"
            >
              <option value="">{t("tickets.allTypes")}</option>
              {TICKET_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(`tickets.type.${tp}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#FFD700] transition-colors" />
          <input
            type="text"
            placeholder={t("common.search")}
            className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]/20 transition-all font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <TicketListTable
        tickets={filteredTickets}
        pagination={pagination}
        loading={loading}
        onSelect={handleSelectTicket}
        onPageChange={setPage}
      />

      {/* Create Modal */}
      {showCreate && (
        <TicketCreateModal
          onClose={() => setShowCreate(false)}
          onSave={async (payload) => {
            await createTicket(payload);
            showToast("success", t("tickets.toast.created"), t("tickets.toast.createdTitle"));
            setShowCreate(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedTicket && !showApprove && !showReject && (
        <TicketDetailModal
          ticket={selectedTicket}
          loading={detailLoading}
          onClose={clearSelectedTicket}
          onReview={handleReview}
          onApprove={handleOpenApprove}
          onReject={handleOpenReject}
          onCancel={handleCancel}
        />
      )}

      {/* Approve Modal */}
      {showApprove && ticketToAction && (
        <TicketApproveModal
          ticketId={ticketToAction._id}
          onClose={() => {
            setShowApprove(false);
            setTicketToAction(null);
          }}
          onConfirm={handleApprove}
        />
      )}

      {/* Reject Modal */}
      {showReject && ticketToAction && (
        <TicketRejectModal
          ticketId={ticketToAction._id}
          onClose={() => {
            setShowReject(false);
            setTicketToAction(null);
          }}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
};
