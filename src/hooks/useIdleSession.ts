import { useEffect, useRef } from "react";

interface UseIdleSessionOptions {
  enabled: boolean;
  idleTimeoutMs: number;
  warningBeforeMs: number;
  throttleMs: number;
  onActivity: (timestamp: number) => void;
  onWarning: () => void;
  onWarningClose: () => void;
  onTimeout: () => void;
  onVisible: () => void;
}

function createThrottle(callback: () => void, waitMs: number): () => void {
  let lastRun = 0;

  return () => {
    const now = Date.now();
    if (now - lastRun < waitMs) return;
    lastRun = now;
    callback();
  };
}

export function useIdleSession({
  enabled,
  idleTimeoutMs,
  warningBeforeMs,
  throttleMs,
  onActivity,
  onWarning,
  onWarningClose,
  onTimeout,
  onVisible,
}: UseIdleSessionOptions): void {
  const warningTimerRef = useRef<number | undefined>(undefined);
  const timeoutTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const clearTimers = () => {
      if (warningTimerRef.current !== undefined) {
        window.clearTimeout(warningTimerRef.current);
        warningTimerRef.current = undefined;
      }
      if (timeoutTimerRef.current !== undefined) {
        window.clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = undefined;
      }
    };

    const scheduleTimers = () => {
      clearTimers();
      const warningDelay = Math.max(idleTimeoutMs - warningBeforeMs, 0);

      warningTimerRef.current = window.setTimeout(() => {
        onWarning();
      }, warningDelay);

      timeoutTimerRef.current = window.setTimeout(() => {
        onTimeout();
      }, idleTimeoutMs);
    };

    const processActivity = () => {
      const now = Date.now();
      onActivity(now);
      onWarningClose();
      scheduleTimers();
    };

    const throttledActivity = createThrottle(processActivity, throttleMs);

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      processActivity();
      onVisible();
    };

    const listenerOptions: AddEventListenerOptions = { passive: true };

    window.addEventListener("mousemove", throttledActivity, listenerOptions);
    window.addEventListener("mousedown", processActivity, listenerOptions);
    window.addEventListener("keydown", processActivity, listenerOptions);
    window.addEventListener("touchstart", processActivity, listenerOptions);
    window.addEventListener("scroll", throttledActivity, listenerOptions);
    document.addEventListener("visibilitychange", onVisibilityChange);

    processActivity();

    return () => {
      clearTimers();
      window.removeEventListener("mousemove", throttledActivity);
      window.removeEventListener("mousedown", processActivity);
      window.removeEventListener("keydown", processActivity);
      window.removeEventListener("touchstart", processActivity);
      window.removeEventListener("scroll", throttledActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    enabled,
    idleTimeoutMs,
    warningBeforeMs,
    throttleMs,
    onActivity,
    onWarning,
    onWarningClose,
    onTimeout,
    onVisible,
  ]);
}
