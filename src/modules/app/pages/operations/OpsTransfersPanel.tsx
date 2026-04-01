/**
 * OpsTransfersPanel — Transfer queue: inbound transfers and pending requests.
 */
import { motion } from "framer-motion";
import { ArrowLeftRight, ArrowDown, Clock, Package } from "lucide-react";
import type { OpsTransferEntry, OpsTransfersResponse } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { StatusBadge } from "../../../../components/ui";
import { listItemVariants } from "../../../../lib/animations";

interface OpsTransfersPanelProps {
  data: OpsTransfersResponse;
}

function TransferRow({
  entry,
  index,
  type,
}: {
  entry: OpsTransferEntry;
  index: number;
  type: "inbound" | "request";
}) {
  const { language } = useLanguage();
  const isEs = language === "es";

  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30"
    >
      <div className={`shrink-0 ${type === "inbound" ? "text-blue-400" : "text-amber-400"}`}>
        {type === "inbound" ? <ArrowDown size={15} /> : <Clock size={15} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{entry.fromLocationName}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
          <Package size={10} />
          <span>
            {entry.itemCount} {isEs ? "ítems" : "items"}
          </span>
          <span className="text-zinc-600">·</span>
          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <StatusBadge status={entry.status} />
    </motion.div>
  );
}

export function OpsTransfersPanel({ data }: OpsTransfersPanelProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const inbound = Array.isArray(data?.inbound) ? data.inbound : [];
  const pendingRequests = Array.isArray(data?.pendingRequests) ? data.pendingRequests : [];
  const total = data?.total ?? 0;

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <ArrowLeftRight size={20} className="text-blue-400" />
          {isEs ? "Cola de Transferencias" : "Transfer Queue"}
          <span className="text-sm text-zinc-500">({total})</span>
        </h3>
        <div className="flex gap-2">
          {inbound.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {inbound.length} {isEs ? "entrantes" : "inbound"}
            </span>
          )}
          {pendingRequests.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingRequests.length} {isEs ? "solicitudes" : "requests"}
            </span>
          )}
        </div>
      </div>

      {total === 0 && inbound.length === 0 && pendingRequests.length === 0 ? (
        <div className="text-center py-6 text-zinc-500">
          <ArrowLeftRight size={28} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">
            {isEs ? "Sin transferencias pendientes" : "No pending transfers"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {inbound.map((entry, i) => (
            <TransferRow key={entry.transferId} entry={entry} index={i} type="inbound" />
          ))}
          {pendingRequests.map((entry, i) => (
            <TransferRow
              key={entry.requestId ?? entry.transferId}
              entry={entry}
              index={i + inbound.length}
              type="request"
            />
          ))}
        </div>
      )}
    </div>
  );
}
