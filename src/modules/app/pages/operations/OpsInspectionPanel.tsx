/**
 * OpsInspectionPanel — Inspection queue grouped by status.
 */
import { motion } from "framer-motion";
import { ClipboardCheck, User, Package, Clock } from "lucide-react";
import type { OpsInspectionsResponse, OpsInspectionItem } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { StatusBadge } from "../../../../components/ui";
import { listItemVariants } from "../../../../lib/animations";

interface OpsInspectionPanelProps {
  data: OpsInspectionsResponse;
}

function InspectionRow({ item, index }: { item: OpsInspectionItem; index: number }) {
  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/40 border border-zinc-700/30"
    >
      <ClipboardCheck size={16} className="text-amber-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <User size={12} className="text-zinc-500" />
          <span className="text-sm text-zinc-200 truncate">{item.customerName}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Package size={10} /> {item.itemCount}
          </span>
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock size={10} /> {new Date(item.returnDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      <StatusBadge status={item.status} />
    </motion.div>
  );
}

export function OpsInspectionPanel({ data }: OpsInspectionPanelProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const pending = Array.isArray(data?.pending) ? data.pending : [];
  const inProgress = Array.isArray(data?.inProgress) ? data.inProgress : [];
  const allItems = [...pending, ...inProgress];
  const total = data?.total ?? allItems.length;

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <ClipboardCheck size={20} className="text-amber-400" />
          {isEs ? "Cola de Inspecciones" : "Inspection Queue"}
          <span className="text-sm text-zinc-500">({total})</span>
        </h3>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {pending.length} {isEs ? "pendientes" : "pending"}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {inProgress.length} {isEs ? "en progreso" : "in progress"}
          </span>
        </div>
      </div>

      {allItems.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-6">
          {isEs ? "Sin inspecciones pendientes" : "No pending inspections"}
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {allItems.map((item, i) => (
            <InspectionRow key={item.loanId} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
