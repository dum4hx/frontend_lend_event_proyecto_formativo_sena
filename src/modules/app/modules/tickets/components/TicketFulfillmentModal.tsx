import React, { useState, useEffect } from "react";
import { X, Server, CheckCircle, Package } from "lucide-react";
import { useLanguage } from "../../../../../contexts/useLanguage";
import {
  getTicketFulfillmentOptions,
  createTransferFromTicket,
} from "../../../../../services/ticketService";
import { getMaterialTypes } from "../../../../../services/materialService";
import type { TicketFulfillmentOption } from "../../../../../types/api";

interface TicketFulfillmentModalProps {
  ticketId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const TicketFulfillmentModal: React.FC<TicketFulfillmentModalProps> = ({
  ticketId,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [options, setOptions] = useState<TicketFulfillmentOption[]>([]);
  const [materialsStore, setMaterialsStore] = useState<Record<string, string>>({});
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [optRes, mtRes] = await Promise.all([
          getTicketFulfillmentOptions(ticketId),
          getMaterialTypes({ limit: 100 }),
        ]);
        if (cancelled) return;

        setOptions(optRes.data || []);

        const mtMap: Record<string, string> = {};
        for (const mt of mtRes.data.materialTypes ?? []) {
          mtMap[mt._id] = mt.code ? `${mt.name} (${mt.code})` : mt.name;
        }
        setMaterialsStore(mtMap);

        // Auto-select the first option that satisfies all (if any)
        const bestOption = optRes.data?.find((o) => o.satisfiesAll);
        if (bestOption) {
          setSelectedLocationId(bestOption.location._id);
        } else if (optRes.data && optRes.data.length > 0) {
          setSelectedLocationId(optRes.data[0].location._id);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId) return;

    setSubmitting(true);
    setError(null);
    try {
      await createTransferFromTicket(ticketId, {
        fromLocationId: selectedLocationId,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const resolveMaterial = (id: string) => materialsStore[id] || id;

  const renderOption = (opt: TicketFulfillmentOption) => {
    const isSelected = selectedLocationId === opt.location._id;
    return (
      <div
        key={opt.location._id}
        onClick={() => setSelectedLocationId(opt.location._id)}
        className={`p-4 border rounded-xl cursor-pointer transition-all ${
          isSelected
            ? "border-[#FFD700] bg-[#FFD700]/5"
            : "border-[#333] bg-[#121212] hover:border-[#555]"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{opt.location.name}</span>
            {opt.location.code && (
              <span className="text-xs bg-[#222] text-gray-400 px-2 py-0.5 rounded-full font-mono">
                {opt.location.code}
              </span>
            )}
          </div>
          {opt.satisfiesAll ? (
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md flex items-center gap-1">
              <CheckCircle size={12} />
              {t("tickets.fulfillment.satisfiesAll")}
            </span>
          ) : (
            <span className="text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-md">
              {t("tickets.fulfillment.inventoryShortage")}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {opt.availableItems.map((item, idx) => {
            const hasEnough = item.availableQuantity >= item.requestedQuantity;
            return (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-gray-300 w-1/2 truncate pr-2 break-all">
                  {resolveMaterial(item.materialTypeId)}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">
                    {t("tickets.fulfillment.requestedQuantity")}:{" "}
                    <strong className="text-white">{item.requestedQuantity}</strong>
                  </span>
                  <span
                    className={`w-28 text-right ${hasEnough ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {t("tickets.fulfillment.availableQuantity")}:{" "}
                    <strong>{item.availableQuantity}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-2xl mx-4 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl flex items-center justify-center">
              <Server size={18} className="text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t("tickets.fulfillment.title")}</h2>
              <p className="text-xs text-gray-500 font-mono">#{ticketId.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#FFD700] border-r-[#FFD700] animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-error text-sm bg-error/10 border border-error/30 rounded-lg px-4 py-3">
              {error}
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">{t("tickets.fulfillment.notAvailable")}</p>
            </div>
          ) : (
            <form id="fulfillment-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {t("tickets.fulfillment.selectLocation")} *
                </label>
                <div className="space-y-3">{options.map(renderOption)}</div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">
                  {t("tickets.fulfillment.notes")}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFD700] resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#222] flex justify-end gap-3 shrink-0 bg-[#1a1a1a] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#222] rounded-lg transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            form="fulfillment-form"
            disabled={submitting || options.length === 0 || !selectedLocationId}
            className="px-6 py-2 text-sm font-bold bg-[#FFD700] text-black rounded-lg hover:bg-[#e6c200] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t("common.saving") : t("tickets.fulfillment.submit")}
          </button>
        </div>
      </div>
    </div>
  );
};
