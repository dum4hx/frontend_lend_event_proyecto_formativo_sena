const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_WARNING_BEFORE_MS = 60 * 1000;
const DEFAULT_ACTIVITY_THROTTLE_MS = 500;

function parsePositiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export const SESSION_CONFIG = {
  idleTimeoutMs: parsePositiveNumber(
    import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MS,
    DEFAULT_IDLE_TIMEOUT_MS,
  ),
  warningBeforeMs: parsePositiveNumber(
    import.meta.env.VITE_SESSION_WARNING_BEFORE_MS,
    DEFAULT_WARNING_BEFORE_MS,
  ),
  activityThrottleMs: parsePositiveNumber(
    import.meta.env.VITE_SESSION_ACTIVITY_THROTTLE_MS,
    DEFAULT_ACTIVITY_THROTTLE_MS,
  ),
} as const;
