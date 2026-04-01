/**
 * OpsInventoryPanel — Inventory issues categorized as damaged, maintenance, or lost.
 */
import { motion } from "framer-motion";
import { Wrench, AlertTriangle, Search } from "lucide-react";
import type { OpsInventoryIssue, OpsInventoryIssuesResponse } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";

interface OpsInventoryPanelProps {
  data: OpsInventoryIssuesResponse;
}

const categoryConfig: Record<
  OpsInventoryIssue["category"],
  { color: string; bg: string; border: string; labelEn: string; labelEs: string }
> = {
  damaged: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    labelEn: "Damaged",
    labelEs: "Dañado",
  },
  maintenance: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    labelEn: "Maintenance",
    labelEs: "Mantenimiento",
  },
  lost: {
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
    labelEn: "Lost",
    labelEs: "Perdido",
  },
};

function IssueRow({ item, index }: { item: OpsInventoryIssue; index: number }) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const cfg = categoryConfig[item.category];

  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cfg.border} ${cfg.bg}`}
    >
      <div className={`shrink-0 ${cfg.color}`}>
        {item.category === "maintenance" ? (
          <Wrench size={15} />
        ) : item.category === "lost" ? (
          <Search size={15} />
        ) : (
          <AlertTriangle size={15} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{item.materialTypeName}</p>
        <p className="text-xs text-zinc-500 font-mono">{item.serialNumber}</p>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg} border ${cfg.border} shrink-0`}
      >
        {isEs ? cfg.labelEs : cfg.labelEn}
      </span>
    </motion.div>
  );
}

export function OpsInventoryPanel({ data }: OpsInventoryPanelProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const damaged = Array.isArray(data?.damaged) ? data.damaged : [];
  const maintenance = Array.isArray(data?.maintenance) ? data.maintenance : [];
  const lost = Array.isArray(data?.lost) ? data.lost : [];
  const total = data?.total ?? 0;

  const allIssues: OpsInventoryIssue[] = [...damaged, ...maintenance, ...lost];

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Wrench size={20} className="text-orange-400" />
          {isEs ? "Problemas de Inventario" : "Inventory Issues"}
          <span className="text-sm text-zinc-500">({total})</span>
        </h3>
        <div className="flex gap-2">
          {damaged.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              {damaged.length} {isEs ? "dañados" : "damaged"}
            </span>
          )}
          {maintenance.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {maintenance.length} {isEs ? "mant." : "maint."}
            </span>
          )}
          {lost.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
              {lost.length} {isEs ? "perdidos" : "lost"}
            </span>
          )}
        </div>
      </div>

      {allIssues.length === 0 ? (
        <div className="text-center py-6 text-zinc-500">
          <Wrench size={28} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">{isEs ? "Sin problemas de inventario" : "No inventory issues"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {allIssues.map((issue, i) => (
            <IssueRow key={`${issue.instanceId}-${i}`} item={issue} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
