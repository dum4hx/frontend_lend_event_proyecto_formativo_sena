import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./ToastContext";
import { useLanguage } from "./useLanguage";
import { SessionContext } from "./sessionContextDefinition";
import type { SessionStatus } from "./sessionContextDefinition";
import { SESSION_CONFIG } from "../config/session";
import { APP_ROUTES } from "../config/routes";
import { logoutUser, refreshToken } from "../services/authService";
import { ApiError } from "../lib/api";
import {
  emitSessionAuthFailure,
  registerSessionEventHandlers,
  type SessionLogoutReason,
} from "../lib/sessionEvents";
import { traceSession } from "../lib/sessionTrace";
import { useIdleSession } from "../hooks/useIdleSession";
import { SessionTimeoutModal } from "../components/ui/SessionTimeoutModal";

interface SessionProviderProps {
  children: ReactNode;
}

function normalizeLogoutReason(reason?: string): SessionLogoutReason {
  if (reason === "INACTIVITY_TIMEOUT") return "INACTIVITY_TIMEOUT";
  if (reason === "SESSION_EXPIRED") return "SESSION_EXPIRED";
  if (reason === "SESSION_REVOKED") return "SESSION_REVOKED";
  if (reason === "SESSION_NOT_FOUND") return "SESSION_NOT_FOUND";
  if (reason === "MISSING_REFRESH_TOKEN") return "MISSING_REFRESH_TOKEN";
  if (reason === "MANUAL") return "MANUAL";
  return "UNAUTHORIZED";
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { isLoggedIn, checkAuth, ensureSession } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("unauthenticated");
  const [lastActivityAt, setLastActivityAt] = useState<number>(Date.now());
  const [warningOpen, setWarningOpen] = useState(false);

  const logoutInFlightRef = useRef<Promise<void> | null>(null);

  const pushLogoutFeedback = useCallback(
    (reason: SessionLogoutReason) => {
      if (reason === "MANUAL") return;
      const keyByReason: Record<
        Exclude<SessionLogoutReason, "MANUAL" | "UNAUTHORIZED"> | "DEFAULT",
        Parameters<typeof t>[0]
      > = {
        INACTIVITY_TIMEOUT: "session.reason.inactivity",
        SESSION_EXPIRED: "session.reason.expired",
        SESSION_REVOKED: "session.reason.invalid",
        SESSION_NOT_FOUND: "session.reason.invalid",
        MISSING_REFRESH_TOKEN: "session.reason.missingRefresh",
        DEFAULT: "session.reason.default",
      };

      const translationKey =
        reason === "UNAUTHORIZED"
          ? keyByReason.DEFAULT
          : (keyByReason[reason] ?? keyByReason.DEFAULT);

      showToast("warning", t(translationKey), t("session.warningTitle"), {
        duration: 6500,
      });
      traceSession("logout-feedback", { reason, translationKey }, "warn");
    },
    [showToast, t],
  );

  const cleanupAndRedirect = useCallback(async () => {
    try {
      localStorage.removeItem("pendingCheckoutPlan");
    } catch {
      /* storage unavailable */
    }

    traceSession("cleanup-and-redirect", { target: APP_ROUTES.login });
    await checkAuth();
    window.location.replace(APP_ROUTES.login);
  }, [checkAuth]);

  const logout = useCallback(
    async (reason: SessionLogoutReason = "MANUAL") => {
      if (logoutInFlightRef.current) {
        traceSession("logout-skipped-inflight", { reason });
        await logoutInFlightRef.current;
        return;
      }

      const task = (async () => {
        const resolvedReason = normalizeLogoutReason(reason);
        traceSession("logout-start", { requestedReason: reason, resolvedReason }, "warn");

        if (resolvedReason === "INACTIVITY_TIMEOUT") {
          setSessionStatus("idle-timeout");
        } else if (resolvedReason !== "MANUAL") {
          setSessionStatus("expired");
        }

        setWarningOpen(false);
        pushLogoutFeedback(resolvedReason);

        try {
          await logoutUser();
          traceSession("logout-request-succeeded", { resolvedReason });
        } catch (error) {
          if (!(error instanceof ApiError)) {
            traceSession("logout-request-failed", { resolvedReason, error }, "warn");
          }
        } finally {
          await cleanupAndRedirect();
        }
      })();

      logoutInFlightRef.current = task;
      try {
        await task;
      } finally {
        logoutInFlightRef.current = null;
      }
    },
    [cleanupAndRedirect, pushLogoutFeedback],
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isLoggedIn) return false;

    setSessionStatus("refreshing");
    traceSession("refresh-session-start", { source: "SessionContext" });
    try {
      await refreshToken();
      await checkAuth();
      setSessionStatus("authenticated");
      traceSession("refresh-session-succeeded", { source: "SessionContext" });
      return true;
    } catch (error) {
      const reason =
        error instanceof ApiError
          ? normalizeLogoutReason(
              error.code ??
                (typeof error.details?.code === "string" ? error.details.code : undefined),
            )
          : "UNAUTHORIZED";

      traceSession(
        "refresh-session-failed",
        {
          source: "SessionContext",
          reason,
          error,
        },
        "warn",
      );

      emitSessionAuthFailure({
        code: reason,
        error: error instanceof ApiError ? error : new ApiError("Unauthorized", 401, reason),
      });
      return false;
    }
  }, [checkAuth, isLoggedIn]);

  const markActivity = useCallback(() => {
    setLastActivityAt(Date.now());
    setWarningOpen(false);
    if (isLoggedIn) {
      setSessionStatus("authenticated");
    }
  }, [isLoggedIn]);

  // Memoize idle session callbacks to prevent infinite update loops
  const onActivityCallback = useCallback((timestamp: number) => {
    setLastActivityAt(timestamp);
    setWarningOpen(false);
    setSessionStatus("authenticated");
  }, []);

  const onWarningCallback = useCallback(() => {
    setWarningOpen(true);
    traceSession("idle-warning-opened", {
      idleTimeoutMs: SESSION_CONFIG.idleTimeoutMs,
      warningBeforeMs: SESSION_CONFIG.warningBeforeMs,
    });
  }, []);

  const onWarningCloseCallback = useCallback(() => {
    setWarningOpen(false);
  }, []);

  const onTimeoutCallback = useCallback(() => {
    traceSession("idle-timeout-reached", { idleTimeoutMs: SESSION_CONFIG.idleTimeoutMs }, "warn");
    void logout("INACTIVITY_TIMEOUT");
  }, [logout]);

  const onVisibleCallback = useCallback(() => {
    if (!isLoggedIn) return;

    // Returning to the tab should not force a token refresh. A stale-aware
    // validation avoids spurious logouts when the focus event happens but the
    // refresh endpoint is momentarily unavailable.
    traceSession("tab-visible-session-check", { source: "visibilitychange" });
    void ensureSession();
  }, [ensureSession, isLoggedIn]);

  useIdleSession({
    enabled: isLoggedIn,
    idleTimeoutMs: SESSION_CONFIG.idleTimeoutMs,
    warningBeforeMs: SESSION_CONFIG.warningBeforeMs,
    throttleMs: SESSION_CONFIG.activityThrottleMs,
    onActivity: onActivityCallback,
    onWarning: onWarningCallback,
    onWarningClose: onWarningCloseCallback,
    onTimeout: onTimeoutCallback,
    onVisible: onVisibleCallback,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setWarningOpen(false);
      setSessionStatus("unauthenticated");
      return;
    }

    setSessionStatus("authenticated");
  }, [isLoggedIn]);

  useEffect(() => {
    registerSessionEventHandlers({
      onAuthFailure: (event) => {
        traceSession("session-handler-auth-failure", {
          code: event.code,
          statusCode: event.error.statusCode,
          message: event.error.message,
          errorCode: event.error.code,
        }, "warn");
        void logout(event.code);
      },
    });

    return () => {
      registerSessionEventHandlers({});
    };
  }, [logout]);

  const contextValue = useMemo(
    () => ({
      sessionStatus,
      lastActivityAt,
      warningOpen,
      logout,
      refreshSession,
      markActivity,
    }),
    [lastActivityAt, logout, markActivity, refreshSession, sessionStatus, warningOpen],
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
      <SessionTimeoutModal
        open={warningOpen && isLoggedIn}
        onStayConnected={() => {
          markActivity();
          void refreshSession();
        }}
        onLogoutNow={() => {
          void logout("MANUAL");
        }}
      />
    </SessionContext.Provider>
  );
}
