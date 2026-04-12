import type { TraceabilityEvent, TraceabilityEventType } from "../types/api";

export type TraceabilityEntityType = "loan" | "transfer";

export interface TraceabilityKpis {
  totalEvents: number;
  latestEventLabel: string;
  latestEventDate: string;
  durationLabel: string;
  durationValue: string;
}

const TRACEABILITY_LABELS_ES: Record<string, string> = {
  checkout: "Retiro / entrega al cliente",
  return_received: "Devolución recibida",
  sent: "Material enviado",
  received: "Material recibido",
};

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(value?: string): string {
  const date = parseDate(value);
  if (!date) return "Fecha no disponible";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDuration(from: Date, to: Date): string {
  const totalMinutes = Math.max(Math.round((to.getTime() - from.getTime()) / 60000), 0);
  if (totalMinutes < 1) return "0 min";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} min`);

  return parts.join(" ");
}

function pickDurationPair(
  sortedEvents: TraceabilityEvent[],
  startEventType: TraceabilityEventType,
  endEventType: TraceabilityEventType,
): { from: Date; to: Date } | null {
  const firstStart = sortedEvents.find((event) => event.eventType === startEventType);
  if (!firstStart) return null;

  const startDate = parseDate(firstStart.occurredAt);
  if (!startDate) return null;

  const endCandidates = sortedEvents.filter((event) => {
    if (event.eventType !== endEventType) return false;
    const endDate = parseDate(event.occurredAt);
    return endDate !== null && endDate.getTime() >= startDate.getTime();
  });

  const latestEnd = endCandidates.at(-1);
  if (!latestEnd) return null;

  const endDate = parseDate(latestEnd.occurredAt);
  if (!endDate) return null;

  return { from: startDate, to: endDate };
}

export function sortTraceabilityEvents(events: TraceabilityEvent[] = []): TraceabilityEvent[] {
  return [...events].sort((left, right) => {
    const leftTime = parseDate(left.occurredAt)?.getTime();
    const rightTime = parseDate(right.occurredAt)?.getTime();

    if (leftTime === undefined && rightTime === undefined) return 0;
    if (leftTime === undefined) return 1;
    if (rightTime === undefined) return -1;

    return leftTime - rightTime;
  });
}

export function mapTraceabilityLabel(eventType: TraceabilityEventType): string {
  return TRACEABILITY_LABELS_ES[eventType] ?? String(eventType);
}

export function computeTraceabilityKpis(
  events: TraceabilityEvent[] = [],
  entityType: TraceabilityEntityType,
): TraceabilityKpis {
  const sortedEvents = sortTraceabilityEvents(events);
  const latestEvent = sortedEvents.at(-1);

  const durationConfig =
    entityType === "transfer"
      ? {
          start: "sent" as const,
          end: "received" as const,
          label: "Tiempo envío -> recepción",
        }
      : {
          start: "checkout" as const,
          end: "return_received" as const,
          label: "Tiempo retiro -> devolución",
        };

  const durationPair = pickDurationPair(sortedEvents, durationConfig.start, durationConfig.end);

  return {
    totalEvents: sortedEvents.length,
    latestEventLabel: latestEvent ? mapTraceabilityLabel(latestEvent.eventType) : "Sin eventos",
    latestEventDate: latestEvent ? formatLocalDate(latestEvent.occurredAt) : "Fecha no disponible",
    durationLabel: durationConfig.label,
    durationValue: durationPair ? formatDuration(durationPair.from, durationPair.to) : "No disponible",
  };
}

export function formatTraceabilityDate(value?: string): string {
  return formatLocalDate(value);
}
