/**
 * OpsInspectionPanel — Inspection queue for returned items awaiting review.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, Barcode, Tag, User, ExternalLink, Copy } from "lucide-react";
import type { OpsInspectionsResponse, OpsInspectionItem } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
import { getLoan } from "../../../../services/loanService";
import { LoanDetailModal } from "../rentals/RentalModals";
import type { LoanView } from "../rentals/types";
import { listItemVariants } from "../../../../lib/animations";

interface OpsInspectionPanelProps {
  data: OpsInspectionsResponse;
}

function InspectionRow({
  item,
  index,
  onLoanClick,
}: {
  item: OpsInspectionItem;
  index: number;
  onLoanClick: (loanId: string) => void;
}) {
  const { copy } = useCopyToClipboard();
  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className="flex flex-col gap-2 px-3 py-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30 group"
    >
      {/* Row header: loan code + customer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ClipboardCheck size={14} className="text-amber-400 shrink-0" />
          <button
            type="button"
            onClick={() => onLoanClick(item.loanId)}
            className="inline-flex items-center gap-1 text-[#FFD700] hover:text-[#FFC700] hover:underline underline-offset-2 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-3 h-3 opacity-60" />
            {item.loanCode ?? `#${item.loanId.slice(-6).toUpperCase()}`}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copy(item.loanCode ?? item.loanId);
            }}
            className="hidden group-hover:inline text-zinc-500 hover:text-[#FFD700] transition-colors"
            title="Copiar código de préstamo"
          >
            <Copy size={12} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
          <User size={11} className="text-zinc-500" />
          <span className="truncate max-w-[120px]">{item.customerName.trim() || "—"}</span>
        </div>
      </div>

      {/* Row detail: material type + instance + serial */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-1">
        <span className="flex items-center gap-1 text-xs text-zinc-300">
          <Tag size={11} className="text-zinc-500" />
          {item.materialTypeName}
        </span>
        <button
          onClick={() => copy(item.instanceId)}
          className="flex items-center gap-1 text-xs text-zinc-500 font-mono hover:text-[#FFD700] hover:underline transition-colors group/copy"
          title="Haz click para copiar"
        >
          ID: {item.instanceId.slice(-8).toUpperCase()}
          <Copy size={11} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={() => copy(item.serialNumber)}
          className="flex items-center gap-1 text-xs text-zinc-500 font-mono hover:text-[#FFD700] hover:underline transition-colors group/copy"
          title="Haz click para copiar"
        >
          <Barcode size={11} /> {item.serialNumber}
          <Copy size={11} className="opacity-0 group-hover/copy:opacity-100 transition-opacity" />
        </button>
      </div>
    </motion.div>
  );
}

export function OpsInspectionPanel({ data }: OpsInspectionPanelProps) {
  const { language, locale } = useLanguage();
  const isEs = language === "es";

  const [loanTarget, setLoanTarget] = useState<LoanView | null>(null);
  const [loadingLoan, setLoadingLoan] = useState(false);

  const items: OpsInspectionItem[] = Array.isArray(data) ? data : [];

  async function handleLoanClick(loanId: string): Promise<void> {
    setLoadingLoan(true);
    try {
      const res = await getLoan(loanId);
      setLoanTarget({ loan: res.data.loan });
    } catch {
      // silently ignore — modal won't open on fetch failure
    } finally {
      setLoadingLoan(false);
    }
  }

  return (
    <>
      <div className="depth-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-amber-400" />
            {isEs ? "Cola de Inspecciones" : "Inspection Queue"}
            <span className="text-sm text-zinc-500">({items.length})</span>
          </h3>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">
            {isEs ? "Sin inspecciones pendientes" : "No pending inspections"}
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {items.map((item, i) => (
              <InspectionRow
                key={item._id}
                item={item}
                index={i}
                onLoanClick={(id) => {
                  void handleLoanClick(id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <LoanDetailModal
        show={!!loanTarget && !loadingLoan}
        onClose={() => setLoanTarget(null)}
        target={loanTarget}
        locale={locale}
        isEs={isEs}
      />
    </>
  );
}
