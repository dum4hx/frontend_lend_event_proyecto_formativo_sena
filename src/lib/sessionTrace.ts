const SESSION_TRACE_KEY = "lendevent_session_trace";
const MAX_TRACE_ENTRIES = 50;

type SessionTraceLevel = "info" | "warn" | "error";

interface SessionTraceEntry {
  timestamp: string;
  level: SessionTraceLevel;
  event: string;
  details?: Record<string, unknown>;
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[max-depth]";
  if (value === null || value === undefined) return value;

  const valueType = typeof value;
  if (valueType === "string" || valueType === "number" || valueType === "boolean") {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeValue(entry, depth + 1));
  }

  if (valueType === "object") {
    const normalizedEntries = Object.entries(value as Record<string, unknown>).slice(0, 20);
    return Object.fromEntries(
      normalizedEntries.map(([key, entryValue]) => [key, sanitizeValue(entryValue, depth + 1)]),
    );
  }

  return String(value);
}

function readTraceEntries(): SessionTraceEntry[] {
  try {
    const raw = sessionStorage.getItem(SESSION_TRACE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as SessionTraceEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTraceEntries(entries: SessionTraceEntry[]): void {
  try {
    sessionStorage.setItem(SESSION_TRACE_KEY, JSON.stringify(entries.slice(-MAX_TRACE_ENTRIES)));
  } catch {
    /* ignore storage failures */
  }
}

export function traceSession(
  event: string,
  details?: Record<string, unknown>,
  level: SessionTraceLevel = "info",
): void {
  const entry: SessionTraceEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    details: details ? (sanitizeValue(details) as Record<string, unknown>) : undefined,
  };

  writeTraceEntries([...readTraceEntries(), entry]);

  const logger =
    level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logger(`[SessionTrace] ${event}`, entry.details ?? {});
}

export function getSessionTraceEntries(): SessionTraceEntry[] {
  return readTraceEntries();
}
