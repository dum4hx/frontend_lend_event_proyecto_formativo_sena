import { renderHook } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useIdleSession } from "../useIdleSession";

type TestCallbacks = {
  onActivity: (timestamp: number) => void;
  onWarning: () => void;
  onWarningClose: () => void;
  onTimeout: () => void;
  onVisible: () => void;
};

function setupHook(callbacks: TestCallbacks) {
  return renderHook(() =>
    useIdleSession({
      enabled: true,
      idleTimeoutMs: 10_000,
      warningBeforeMs: 2_000,
      throttleMs: 500,
      ...callbacks,
    }),
  );
}

describe("useIdleSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-11T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens warning before timeout and triggers logout on timeout", () => {
    const callbacks: TestCallbacks = {
      onActivity: vi.fn(),
      onWarning: vi.fn(),
      onWarningClose: vi.fn(),
      onTimeout: vi.fn(),
      onVisible: vi.fn(),
    };

    setupHook(callbacks);

    expect(callbacks.onActivity).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(8_000);
    expect(callbacks.onWarning).toHaveBeenCalledTimes(1);
    expect(callbacks.onTimeout).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(2_000);
    expect(callbacks.onTimeout).toHaveBeenCalledTimes(1);
  });

  it("resets warning and timeout when activity is detected", () => {
    const callbacks: TestCallbacks = {
      onActivity: vi.fn(),
      onWarning: vi.fn(),
      onWarningClose: vi.fn(),
      onTimeout: vi.fn(),
      onVisible: vi.fn(),
    };

    setupHook(callbacks);

    vi.advanceTimersByTime(7_500);
    window.dispatchEvent(new Event("mousemove"));

    expect(callbacks.onActivity).toHaveBeenCalledTimes(2);
    expect(callbacks.onWarningClose).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(7_500);
    expect(callbacks.onWarning).toHaveBeenCalledTimes(0);

    vi.advanceTimersByTime(500);
    expect(callbacks.onWarning).toHaveBeenCalledTimes(1);
  });

  it("calls visibility callback when tab becomes visible", () => {
    const callbacks: TestCallbacks = {
      onActivity: vi.fn(),
      onWarning: vi.fn(),
      onWarningClose: vi.fn(),
      onTimeout: vi.fn(),
      onVisible: vi.fn(),
    };

    setupHook(callbacks);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(callbacks.onVisible).toHaveBeenCalledTimes(1);
    expect(callbacks.onActivity).toHaveBeenCalledTimes(2);
  });
});
