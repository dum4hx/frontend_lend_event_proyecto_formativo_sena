import { useMemo, useState } from "react";
import type { TraceabilityEvent } from "../../types/api";
import {
  computeTraceabilityKpis,
  formatTraceabilityDate,
  mapTraceabilityLabel,
  sortTraceabilityEvents,
  type TraceabilityEntityType,
} from "../../utils/traceability";

export interface MaterialTraceabilityTimelineProps {
  /** Traceability events to show in the timeline. */
  events?: TraceabilityEvent[];
  /** Entity type for KPI calculations. */
  entityType: TraceabilityEntityType;
  /** Optional loading state used while detail data is being fetched. */
  isLoading?: boolean;
  /** Optional section title. */
  title?: string;
  /** Optional empty state label. */
  emptyLabel?: string;
}

type TraceabilityFilter = "all" | "delivery" | "reception";

const FILTER_LABELS: Record<TraceabilityFilter, string> = {
  all: "Todos",
  delivery: "Entregas / envíos",
  reception: "Recepciones / devoluciones",
};

const EVENT_BADGE_CLASS: Record<string, string> = {
  checkout: "bg-amber-500/15 text-amber-300 border-amber-400/40",
  sent: "bg-blue-500/15 text-blue-300 border-blue-400/40",
  return_received: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  received: "bg-teal-500/15 text-teal-300 border-teal-400/40",
};

const UNKNOWN_USER_LABEL = "Usuario no disponible";
const DEFAULT_EMPTY_LABEL = "Sin eventos de trazabilidad aún";
const LONG_NOTES_THRESHOLD = 100;

function isDeliveryEvent(eventType: string): boolean {
  return eventType === "checkout" || eventType === "sent";
}

function isReceptionEvent(eventType: string): boolean {
  return eventType === "return_received" || eventType === "received";
}

function resolveEventsByFilter(events: TraceabilityEvent[], filter: TraceabilityFilter) {
  if (filter === "all") return events;
  if (filter === "delivery") return events.filter((event) => isDeliveryEvent(event.eventType));
  return events.filter((event) => isReceptionEvent(event.eventType));
}

function getActorName(event: TraceabilityEvent): string {
  const actorName = event.performedByName?.trim();
  if (actorName) return actorName;

  const actorEmail = event.performedByEmail?.trim();
  if (actorEmail) return actorEmail;

  const actorId = event.performedBy?.trim();
  if (actorId) return actorId;

  return UNKNOWN_USER_LABEL;
}

/**
 * MaterialTraceabilityTimeline
 * Renders an ordered timeline for material lifecycle events.
 */
export function MaterialTraceabilityTimeline({
  events = [],
  entityType,
  isLoading = false,
  title = "Trazabilidad Operativa",
  emptyLabel = DEFAULT_EMPTY_LABEL,
}: MaterialTraceabilityTimelineProps) {
  const [activeFilter, setActiveFilter] = useState<TraceabilityFilter>("all");

  const sortedEvents = useMemo(() => sortTraceabilityEvents(events), [events]);
  const filteredEvents = useMemo(
    () => resolveEventsByFilter(sortedEvents, activeFilter),
    [sortedEvents, activeFilter],
  );
  const kpis = useMemo(() => computeTraceabilityKpis(sortedEvents, entityType), [sortedEvents, entityType]);

  if (isLoading) {
    return (
      <section
        className="border border-[#333] rounded-lg p-3 bg-[#1a1a1a]"
        data-help-id="traceability-timeline"
        aria-label="Sección de trazabilidad operativa"
      >
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">{title}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4" data-testid="material-traceability-kpi-skeleton">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border border-[#2d2d2d] bg-[#151515] p-3 animate-pulse"
            >
              <div className="h-2.5 w-28 bg-[#2a2a2a] rounded" />
              <div className="h-4 w-20 bg-[#232323] rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="space-y-3" data-testid="material-traceability-skeleton">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border border-[#2d2d2d] bg-[#151515] p-3 animate-pulse"
            >
              <div className="h-3 w-44 bg-[#2a2a2a] rounded" />
              <div className="h-3 w-32 bg-[#232323] rounded mt-2" />
              <div className="h-3 w-24 bg-[#232323] rounded mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className="border border-[#333] rounded-lg p-3 bg-[#1a1a1a]"
      data-help-id="traceability-timeline"
      aria-label="Sección de trazabilidad operativa"
    >
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">{title}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4" aria-label="Indicadores de trazabilidad">
        <div className="rounded-md border border-[#2d2d2d] bg-[#151515] px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Total de eventos</p>
          <p className="text-lg font-semibold text-white" data-testid="traceability-kpi-total-events">
            {kpis.totalEvents}
          </p>
        </div>
        <div className="rounded-md border border-[#2d2d2d] bg-[#151515] px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">Último evento</p>
          <p className="text-sm font-semibold text-white" data-testid="traceability-kpi-latest-event">
            {kpis.latestEventLabel}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{kpis.latestEventDate}</p>
        </div>
        <div className="rounded-md border border-[#2d2d2d] bg-[#151515] px-3 py-2.5 sm:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">{kpis.durationLabel}</p>
          <p className="text-lg font-semibold text-[#FFD700]" data-testid="traceability-kpi-duration">
            {kpis.durationValue}
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 mb-4"
        role="group"
        aria-label="Filtros de trazabilidad"
      >
        {(["all", "delivery", "reception"] as TraceabilityFilter[]).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] ${
                isActive
                  ? "border-[#FFD700]/60 bg-[#FFD700]/15 text-[#FFD700]"
                  : "border-[#3a3a3a] bg-[#141414] text-gray-300 hover:border-[#555]"
              }`}
              aria-pressed={isActive}
              aria-label={`Filtrar por ${FILTER_LABELS[filter]}`}
            >
              {FILTER_LABELS[filter]}
            </button>
          );
        })}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#3a3a3a] bg-[#141414] px-3 py-4">
          <p className="text-sm text-gray-400" data-testid="material-traceability-empty">
            {emptyLabel}
          </p>
        </div>
      ) : (
        <ol
          className="relative border-l border-[#333] pl-4 space-y-4"
          data-testid="material-traceability-list"
          aria-label="Timeline de trazabilidad"
        >
          {filteredEvents.map((event, index) => {
            const actorName = getActorName(event);
            const actorEmail = event.performedByEmail?.trim();
            const trimmedNotes = event.notes?.trim();
            const isLongNotes = (trimmedNotes?.length ?? 0) > LONG_NOTES_THRESHOLD;
            const badgeClass = EVENT_BADGE_CLASS[event.eventType] ?? "bg-gray-500/15 text-gray-300 border-gray-400/40";

            return (
              <li
                key={`${event.eventType}-${event.occurredAt}-${index}`}
                className="relative"
                data-testid="material-traceability-item"
              >
                <span className="absolute -left-[1.15rem] top-1 h-2.5 w-2.5 rounded-full bg-[#FFD700] border border-[#111]" />
                <div className="rounded-md border border-[#2d2d2d] bg-[#151515] px-3 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${badgeClass}`}
                    data-testid="material-traceability-label"
                  >
                    {mapTraceabilityLabel(event.eventType)}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatTraceabilityDate(event.occurredAt)}</p>
                  <p className="text-sm text-gray-200 mt-2">{actorName}</p>
                  {actorEmail && actorEmail !== actorName && (
                    <p className="text-xs text-gray-400 mt-0.5">{actorEmail}</p>
                  )}
                  {trimmedNotes && !isLongNotes && (
                    <p className="text-xs text-gray-300 mt-2 whitespace-pre-wrap">{trimmedNotes}</p>
                  )}
                  {trimmedNotes && isLongNotes && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-[#FFD700] hover:text-[#ffe066] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700] rounded-sm">
                        Ver observaciones
                      </summary>
                      <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">{trimmedNotes}</p>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
