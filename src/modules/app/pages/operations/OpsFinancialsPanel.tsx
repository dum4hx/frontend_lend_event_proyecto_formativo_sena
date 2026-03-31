/**
 * OpsFinancialsPanel — Overdue invoices with customer details.
 */
import { motion } from "framer-motion";
import { FileWarning, DollarSign, Calendar, AlertTriangle } from "lucide-react";
import type { OpsOverdueFinancialsResponse } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";

interface OpsFinancialsPanelProps {
  data: OpsOverdueFinancialsResponse;
}

export function OpsFinancialsPanel({ data }: OpsFinancialsPanelProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(isEs ? "es-CO" : "en-US", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <FileWarning size={20} className="text-red-400" />
          {isEs ? "Facturas Vencidas" : "Overdue Invoices"}
          <span className="text-sm text-zinc-500">({data.totalOverdue})</span>
        </h3>
        {data.totalAmount > 0 && (
          <span className="text-sm font-medium text-red-400">
            {formatCurrency(data.totalAmount)}
          </span>
        )}
      </div>

      {data.invoices.length === 0 ? (
        <div className="text-center py-6 text-zinc-500">
          <DollarSign size={28} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">{isEs ? "Sin facturas vencidas" : "No overdue invoices"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
          {data.invoices.map((inv, i) => (
            <motion.div
              key={inv.invoiceId}
              variants={listItemVariants}
              initial="initial"
              animate="animate"
              custom={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-800/40 border border-red-500/20"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {inv.customerName}
                  </span>
                  <span className="text-xs text-zinc-500">#{inv.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <DollarSign size={10} />
                    {formatCurrency(inv.amount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30">
                <AlertTriangle size={10} />
                {inv.daysOverdue}d
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
