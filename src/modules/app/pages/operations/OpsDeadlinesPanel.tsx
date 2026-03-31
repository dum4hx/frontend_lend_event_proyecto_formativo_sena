/**
 * OpsDeadlinesPanel — Loans with approaching or overdue deadlines.
 */
import { motion } from "framer-motion";
import { Clock, AlertTriangle, User, Package } from "lucide-react";
import type { OpsLoanDeadline, OpsLoanDeadlinesResponse } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";

interface OpsDeadlinesPanelProps {
  data: OpsLoanDeadlinesResponse;
}

function DeadlineRow({
  loan,
  index,
  isOverdue,
}: {
  loan: OpsLoanDeadline;
  index: number;
  isOverdue: boolean;
}) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const hoursAbs = Math.abs(loan.hoursRemaining);
  const timeLabel = isOverdue
    ? `${hoursAbs}h ${isEs ? "vencido" : "overdue"}`
    : `${hoursAbs}h ${isEs ? "restantes" : "remaining"}`;

  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
        isOverdue ? "bg-red-500/10 border-red-500/30" : "bg-amber-500/10 border-amber-500/20"
      }`}
    >
      <div className={`shrink-0 ${isOverdue ? "text-red-400" : "text-amber-400"}`}>
        {isOverdue ? <AlertTriangle size={15} /> : <Clock size={15} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <User size={11} className="text-zinc-500" />
          <span className="text-sm font-medium text-zinc-200 truncate">{loan.customerName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Package size={10} />
          <span>
            {loan.materialCount} {isEs ? "ítems" : "items"}
          </span>
          <span className="text-zinc-600">·</span>
          <span>{new Date(loan.endDate).toLocaleDateString()}</span>
        </div>
      </div>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          isOverdue ? "text-red-400 bg-red-500/10" : "text-amber-400 bg-amber-500/10"
        }`}
      >
        {timeLabel}
      </span>
    </motion.div>
  );
}

export function OpsDeadlinesPanel({ data }: OpsDeadlinesPanelProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Clock size={20} className="text-amber-400" />
          {isEs ? "Vencimientos de Préstamos" : "Loan Deadlines"}
          <span className="text-sm text-zinc-500">({data.total})</span>
        </h3>
        <div className="flex gap-2">
          {data.overdue.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              {data.overdue.length} {isEs ? "vencidos" : "overdue"}
            </span>
          )}
          {data.dueSoon.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {data.dueSoon.length} {isEs ? "próximos" : "due soon"}
            </span>
          )}
        </div>
      </div>

      {data.total === 0 ? (
        <div className="text-center py-6 text-zinc-500">
          <Clock size={28} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">{isEs ? "Sin vencimientos próximos" : "No upcoming deadlines"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {data.overdue.map((loan, i) => (
            <DeadlineRow key={loan.loanId} loan={loan} index={i} isOverdue={true} />
          ))}
          {data.dueSoon.map((loan, i) => (
            <DeadlineRow
              key={loan.loanId}
              loan={loan}
              index={i + data.overdue.length}
              isOverdue={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
