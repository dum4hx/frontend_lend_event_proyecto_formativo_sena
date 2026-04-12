import React, { useState } from "react";
import { X, XCircle } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { validateResolutionNote } from "../../../../../utils/validators";
import type { RejectTicketPayload } from "../../../../../types/api";

interface TicketRejectModalProps {
  /** Ticket ID being rejected. */
  ticketId: string;
  /** Close the modal. */
  onClose: () => void;
  /** Submit rejection. */
  onConfirm: (payload: RejectTicketPayload) => Promise<void>;
}

/**
 * Modal dialog to reject a ticket with a required reason.
 */
export const TicketRejectModal: React.FC<TicketRejectModalProps> = ({
  ticketId,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const noteValidation = resolutionNote ? validateResolutionNote(resolutionNote) : undefined;
  const noteError = resolutionNote ? noteValidation?.message : undefined;
  const isValid = !!resolutionNote.trim() && !noteError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      await onConfirm({ resolutionNote: resolutionNote.trim() });
    } catch (err) {
      setSubmitError((err as Error).message || t("tickets.toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center">
              <XCircle size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t("tickets.reject")}</h2>
              <p className="text-xs text-gray-500 font-mono">{ticketId.slice(0, 12)}…</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-gray-400">{t("tickets.confirmReject")}</p>

          <div>
            <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              {t("tickets.field.resolutionNote")} *
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={3}
              className={`w-full bg-[#121212] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none ${noteError ? "border-error bg-error/10" : "border-[#333]"}`}
              placeholder={t("tickets.field.resolutionNote")}
              required
              aria-invalid={!!noteError}
              data-help-id="tickets-reject-note"
            />
            {noteError && <p className="text-error text-sm mt-1">{noteError}</p>}
          </div>

          {submitError && (
            <p className="text-error text-sm bg-error/10 border border-error/30 rounded-lg px-4 py-2">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-[#222] rounded-lg transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-colors ${
                isValid && !submitting
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-[#333] text-gray-500 cursor-not-allowed opacity-50"
              }`}
            >
              {submitting ? t("common.saving") : t("tickets.reject")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
