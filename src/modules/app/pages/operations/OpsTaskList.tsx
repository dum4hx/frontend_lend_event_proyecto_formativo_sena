/**
 * OpsTaskList — Unified prioritized TO-DO list.
 *
 * Displays tasks aggregated from all operations endpoints,
 * color-coded by priority and grouped with counts.
 */
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import type { OpsTask, OpsTaskPriority, OpsTasksResponse } from "../../../../types/api";
import { useLanguage } from "../../../../contexts/useLanguage";
import { listItemVariants } from "../../../../lib/animations";

interface OpsTaskListProps {
  data: OpsTasksResponse;
}

const priorityConfig: Record<
  OpsTaskPriority,
  {
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    label: string;
    labelEs: string;
  }
> = {
  critical: {
    icon: <AlertTriangle size={16} />,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "Critical",
    labelEs: "Crítico",
  },
  high: {
    icon: <ArrowUp size={16} />,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    label: "High",
    labelEs: "Alto",
  },
  medium: {
    icon: <AlertCircle size={16} />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Medium",
    labelEs: "Medio",
  },
  low: {
    icon: <ArrowDown size={16} />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    label: "Low",
    labelEs: "Bajo",
  },
};

function PriorityBadge({ priority }: { priority: OpsTaskPriority }) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const cfg = priorityConfig[priority];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg} border ${cfg.border}`}
    >
      {cfg.icon}
      {isEs ? cfg.labelEs : cfg.label}
    </span>
  );
}

function TaskRow({ task, index }: { task: OpsTask; index: number }) {
  const cfg = priorityConfig[task.priority];
  return (
    <motion.div
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      custom={index}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${cfg.border} ${cfg.bg} hover:brightness-110 transition-all cursor-default group`}
    >
      <div className={`shrink-0 ${cfg.color}`}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{task.title}</p>
        <p className="text-xs text-zinc-400 truncate">{task.description}</p>
      </div>
      <PriorityBadge priority={task.priority} />
      {task.dueDate && (
        <span className="text-xs text-zinc-500 whitespace-nowrap hidden sm:inline">
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
      <ChevronRight
        size={14}
        className="text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0"
      />
    </motion.div>
  );
}

export function OpsTaskList({ data }: OpsTaskListProps) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { tasks, summary } = data;

  return (
    <div className="depth-card rounded-xl p-5">
      {/* Header with summary badges */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-zinc-100">
          {isEs ? "Tareas Pendientes" : "Pending Tasks"}
          <span className="ml-2 text-sm text-zinc-500">({summary.total})</span>
        </h3>
        <div className="flex gap-2">
          {summary.critical > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30">
              {summary.critical} {isEs ? "críticos" : "critical"}
            </span>
          )}
          {summary.high > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
              {summary.high} {isEs ? "altos" : "high"}
            </span>
          )}
        </div>
      </div>

      {/* List */}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <AlertCircle size={32} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm">{isEs ? "¡Sin tareas pendientes!" : "No pending tasks!"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
          {tasks.map((task, i) => (
            <TaskRow key={task.id} task={task} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
