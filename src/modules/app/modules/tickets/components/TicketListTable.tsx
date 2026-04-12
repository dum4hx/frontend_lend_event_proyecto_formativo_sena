import React from "react";
import { Eye } from "lucide-react";
import { StatusBadge, EmptyState, Pagination } from "../../../../../components/ui";
import { useLanguage } from "../../../../../contexts/useLanguage";
import type {
  TicketListItem,
  TicketStatus,
  TicketType,
  PaginationMeta,
} from "../../../../../types/api";

interface TicketListTableProps {
  /** The list of tickets to render. */
  tickets: TicketListItem[];
  /** Pagination metadata. */
  pagination: PaginationMeta;
  /** Whether data is loading. */
  loading: boolean;
  /** Callback when user clicks a ticket row. */
  onSelect: (ticket: TicketListItem) => void;
  /** Callback when user changes page. */
  onPageChange: (page: number) => void;
}

const STATUS_VARIANT: Record<TicketStatus, string> = {
  pending: "pending",
  in_review: "acknowledged",
  approved: "approved",
  rejected: "rejected",
  cancelled: "cancelled",
  expired: "expired",
};

const TYPE_COLORS: Record<TicketType, string> = {
  transfer_request: "text-blue-400",
  incident_report: "text-red-400",
  maintenance_request: "text-amber-400",
  inspection_request: "text-teal-400",
  generic: "text-gray-400",
};

/**
 * Reusable table for displaying ticket list items with pagination.
 */
export const TicketListTable: React.FC<TicketListTableProps> = ({
  tickets,
  pagination,
  loading,
  onSelect,
  onPageChange,
}) => {
  const { t, formatDate } = useLanguage();

  if (!loading && tickets.length === 0) {
    return <EmptyState title={t("tickets.empty")} description={t("tickets.emptyDescription")} />;
  }

  return (
    <div
      className="bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-2xl"
      data-help-id="tickets-table"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#222] bg-[#0d0d0d]">
              <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {t("tickets.field.title")}
              </th>
              <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {t("tickets.field.type")}
              </th>
              <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {t("tickets.field.status")}
              </th>
              <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {t("tickets.field.creator")}
              </th>
              <th className="py-4 px-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {t("tickets.field.createdAt")}
              </th>
              <th className="py-4 px-6 text-right text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {tickets.map((ticket) => (
              <tr
                key={ticket._id}
                className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                onClick={() => onSelect(ticket)}
              >
                <td className="py-4 px-6">
                  <span className="text-sm text-white font-medium truncate max-w-[250px] block">
                    {ticket.title}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`text-xs font-semibold ${TYPE_COLORS[ticket.type]}`}>
                    {t(`tickets.type.${ticket.type}`)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <StatusBadge
                    status={STATUS_VARIANT[ticket.status]}
                    label={t(`tickets.status.${ticket.status}`)}
                  />
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs text-gray-400 font-mono">
                    {typeof ticket.createdBy === "string"
                      ? ticket.createdBy.slice(-8).toUpperCase()
                      : "—"}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="text-xs text-gray-500 font-mono">
                    {formatDate(ticket.createdAt)}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(ticket);
                    }}
                    className="p-2 text-gray-500 hover:text-[#FFD700] hover:bg-[#222] rounded-lg transition-colors"
                    title={t("tickets.viewDetail")}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="border-t border-[#222]" data-help-id="tickets-pagination">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
