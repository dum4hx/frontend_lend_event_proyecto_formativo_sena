/**
 * OpsKpiGrid — Key Performance Indicator cards for the operations overview.
 */
import { motion } from "framer-motion";
import {
  Package,
  ClipboardCheck,
  FileWarning,
  Wrench,
  AlertTriangle,
  ArrowLeftRight,
  Clock,
} from "lucide-react";
import type { OpsOverview } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";

interface OpsKpiGridProps {
  data: OpsOverview;
}

interface KpiCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgGlow: string;
}

export function OpsKpiGrid({ data }: OpsKpiGridProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  if (!data) {
    return (
      <div className="depth-card rounded-xl p-5 text-center text-zinc-500">
        <Package size={28} className="mx-auto mb-2 text-zinc-600" />
        <p className="text-sm">{isEs ? "Sin datos disponibles" : "No data available"}</p>
      </div>
    );
  }

  const cards: KpiCard[] = [
    {
      label: isEs ? "Préstamos Activos" : "Active Loans",
      value: data.loans?.active ?? 0,
      icon: <Package size={22} />,
      color: "text-blue-400",
      bgGlow: "shadow-blue-500/10",
    },
    {
      label: isEs ? "Inspecciones Pend." : "Pending Inspections",
      value: data.loans?.returnPendingInspection ?? 0,
      icon: <ClipboardCheck size={22} />,
      color: "text-amber-400",
      bgGlow: "shadow-amber-500/10",
    },
    {
      label: isEs ? "Facturas Vencidas" : "Overdue Invoices",
      value: data.financials?.overdueInvoices ?? 0,
      icon: <FileWarning size={22} />,
      color: (data.financials?.overdueInvoices ?? 0) > 0 ? "text-red-400" : "text-emerald-400",
      bgGlow:
        (data.financials?.overdueInvoices ?? 0) > 0 ? "shadow-red-500/10" : "shadow-emerald-500/10",
    },
    {
      label: isEs ? "Dañados" : "Damaged Items",
      value: data.inventory?.itemsDamaged ?? 0,
      icon: <AlertTriangle size={22} />,
      color: (data.inventory?.itemsDamaged ?? 0) > 0 ? "text-orange-400" : "text-emerald-400",
      bgGlow:
        (data.inventory?.itemsDamaged ?? 0) > 0 ? "shadow-orange-500/10" : "shadow-emerald-500/10",
    },
    {
      label: isEs ? "Mantenimiento" : "Maintenance",
      value: data.inventory?.itemsInRepair ?? 0,
      icon: <Wrench size={22} />,
      color: "text-yellow-400",
      bgGlow: "shadow-yellow-500/10",
    },
    {
      label: isEs ? "Transfer. Pend." : "Pending Transfers",
      value: (data.transfers?.incomingPending ?? 0) + (data.transfers?.outgoingPending ?? 0),
      icon: <ArrowLeftRight size={22} />,
      color: "text-purple-400",
      bgGlow: "shadow-purple-500/10",
    },
    {
      label: isEs ? "Vencen Pronto" : "Expiring Soon",
      value: data.loans?.dueToday ?? 0,
      icon: <Clock size={22} />,
      color: (data.loans?.dueToday ?? 0) > 0 ? "text-amber-400" : "text-emerald-400",
      bgGlow: (data.loans?.dueToday ?? 0) > 0 ? "shadow-amber-500/10" : "shadow-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          variants={listItemVariants}
          initial="initial"
          animate="animate"
          custom={i}
          className={`depth-card rounded-xl p-4 flex flex-col gap-2 ${card.bgGlow}`}
        >
          <div className={`${card.color}`}>{card.icon}</div>
          <span className="text-2xl font-bold text-zinc-100">{card.value}</span>
          <span className="text-xs text-zinc-400 leading-tight">{card.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
