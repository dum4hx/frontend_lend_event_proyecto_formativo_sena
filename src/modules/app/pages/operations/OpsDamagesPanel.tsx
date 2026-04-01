/**
 * OpsDamagesPanel — Damage resolution queue: pending assessment, repair, and billing.
 */
import { motion } from "framer-motion";
import { Hammer, AlertTriangle, DollarSign, User } from "lucide-react";
import type { OpsDamageItem, OpsDamagesResponse } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";

interface OpsDamagesPanelProps {
  data: OpsDamagesResponse;
}

type DamagePhase = "assessment" | "repair" | "billing";

const phaseConfig: Record<
  DamagePhase,
  { color: string; bg: string; border: string; labelEn: string; labelEs: string }
> = {
  assessment: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    labelEn: "Assessment",
    labelEs: "Evaluación",
  },
  repair: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    labelEn: "Repair",
    labelEs: "Reparación",
  },
  billing: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    labelEn: "Billing",
    labelEs: "Cobro",
  },
};

function DamageRow({
  item,
  phase,
  index,
}: {
  item: OpsDamageItem;
  phase: DamagePhase;
  index: number;
}) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const cfg = phaseConfig[phase];

  const formatCOP = (amount: number) =>
    new Intl.NumberFormat(isEs ? "es-CO" : "en-US", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cfg.border} ${cfg.bg}`}
    >
      <AlertTriangle size={15} className={`${cfg.color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{item.materialTypeName}</p>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
          <span className="font-mono">{item.serialNumber}</span>
          <span className="text-zinc-600">·</span>
          <User size={10} />
          <span className="truncate">{item.customerName}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg} border ${cfg.border}`}
        >
          {isEs ? cfg.labelEs : cfg.labelEn}
        </span>
        {item.estimatedCost !== undefined && (
          <span className="text-xs text-zinc-500 flex items-center gap-0.5">
            <DollarSign size={9} />
            {formatCOP(item.estimatedCost)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function OpsDamagesPanel({ data }: OpsDamagesPanelProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const pendingAssessment = Array.isArray(data?.pendingAssessment) ? data.pendingAssessment : [];
  const pendingRepair = Array.isArray(data?.pendingRepair) ? data.pendingRepair : [];
  const pendingBilling = Array.isArray(data?.pendingBilling) ? data.pendingBilling : [];
  const total = data?.total ?? 0;

  const allItems = [
    ...pendingAssessment.map((i) => ({ item: i, phase: "assessment" as DamagePhase })),
    ...pendingRepair.map((i) => ({ item: i, phase: "repair" as DamagePhase })),
    ...pendingBilling.map((i) => ({ item: i, phase: "billing" as DamagePhase })),
  ];

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Hammer size={20} className="text-orange-400" />
          {isEs ? "Cola de Daños" : "Damage Queue"}
          <span className="text-sm text-zinc-500">({total})</span>
        </h3>
        <div className="flex gap-2">
          {pendingAssessment.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {pendingAssessment.length} {isEs ? "eval." : "assess."}
            </span>
          )}
          {pendingRepair.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              {pendingRepair.length} {isEs ? "rep." : "repair"}
            </span>
          )}
          {pendingBilling.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              {pendingBilling.length} {isEs ? "cobro" : "billing"}
            </span>
          )}
        </div>
      </div>

      {allItems.length === 0 ? (
        <div className="text-center py-6 text-zinc-500">
          <Hammer size={28} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">{isEs ? "Sin daños pendientes" : "No pending damages"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {allItems.map(({ item, phase }, i) => (
            <DamageRow key={`${item.instanceId}-${i}`} item={item} phase={phase} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
