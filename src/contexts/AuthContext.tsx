import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, refreshToken } from "../services/authService";
import { ApiError } from "../lib/api";
import { setAuthFailureHandler } from "../lib/api";
import { traceSession } from "../lib/sessionTrace";
import type { User } from "../types/api";
import { queryClient } from "../lib/queryClient";
import {
  AUTH_SESSION_CLEARED_EVENT,
  getAuthenticatedHomeUrl,
  isPrivatePath,
  isPublicAuthPath,
} from "../utils/authRoutePolicy";

// -- Storage key -------------------------------------------------------------

const PERMISSIONS_KEY = "lendevent_permissions";

// -- Context shape -----------------------------------------------------------

export interface AuthContextValue {
  /** The logged-in user, or `null` when unauthenticated. */
  user: User | null;
  /** Canonical loading flag while session validation is in flight. */
  loading: boolean;
  /** Canonical auth flag derived from the resolved session. */
  isAuthenticated: boolean;
  /** Backward-compatible alias for `isAuthenticated`. */
  isLoggedIn: boolean;
  /** Backward-compatible alias for `loading`. */
  isLoading: boolean;
  /** Flat list of permission keys for the current user. */
  permissions: string[];
  /** Last successful `/auth/me` validation timestamp. */
  lastValidatedAt: number | null;
  /**
   * Force a full session validation cycle (`/auth/me`, then refresh+retry when needed).
   * Returns the fetched user and permissions.
   */
  checkAuth: () => Promise<{ user: User | null; permissions: string[] }>;
  /**
   * Validate session only when stale (unless `force=true`).
   * Returns `true` when user remains authenticated.
   */
  ensureSession: (options?: { force?: boolean; staleMs?: number }) => Promise<boolean>;
  /** Fast stale check used by route guards before sensitive rendering. */
  isSessionStale: (staleMs?: number) => boolean;
  /** Clears all auth state on the client. */
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// -- Helpers -----------------------------------------------------------------

function loadPersistedPermissions(): string[] {
  try {
    const raw = sessionStorage.getItem(PERMISSIONS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    /* ignore corrupt data */
  }
  return [];
}

function persistPermissions(permissions: string[]): void {
  try {
    sessionStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  } catch {
    /* quota exceeded or private mode */
  }
}

function clearPersistedPermissions(): void {
  try {
    sessionStorage.removeItem(PERMISSIONS_KEY);
  } catch {
    /* ignore */
  }
}

// -- Provider ----------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

interface SessionResult {
  user: User | null;
  permissions: string[];
}

const DEFAULT_STALE_MS = 10 * 60_000;

/**
 * Snapshot of session state kept up-to-date every render via direct
 * assignment (not a useEffect). Callbacks read from this ref so they
 * never need state values in their dependency arrays, which would
 * otherwise cause validateSession to change reference on every state
 * update and trigger an infinite /auth/me polling loop.
 */
interface SessionSnapshot {
  user: User | null;
  permissions: string[];
  lastValidatedAt: number | null;
  pathname: string;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>(loadPersistedPermissions);
  const [loading, setLoading] = useState(true);
  const [lastValidatedAt, setLastValidatedAt] = useState<number | null>(null);

  // Always-current snapshot — assigned on every render, never inside an effect.
  // This lets callbacks read the latest state without listing it as a dep,
  // which is the key fix preventing the infinite validateSession loop.
  const sessionRef = useRef<SessionSnapshot>({
    user,
    permissions,
    lastValidatedAt,
    pathname: location.pathname,
  });
  sessionRef.current = { user, permissions, lastValidatedAt, pathname: location.pathname };

  const validationInFlight = useRef<Promise<SessionResult> | null>(null);
  const hasBootstrappedRef = useRef(false);

  const applySession = useCallback((nextUser: User, nextPermissions: string[]) => {
    traceSession("session-applied", {
      userId: nextUser._id,
      roleName: nextUser.roleName,
      permissionCount: nextPermissions.length,
    });
    setUser(nextUser);
    setPermissions(nextPermissions);
    setLastValidatedAt(Date.now());
    persistPermissions(nextPermissions);
  }, []);

  const clearSession = useCallback(() => {
    traceSession("session-cleared", { pathname: sessionRef.current.pathname }, "warn");
    setUser(null);
    setPermissions([]);
    setLastValidatedAt(null);
    clearPersistedPermissions();

    try {
      localStorage.removeItem("pendingCheckoutPlan");
    } catch {
      /* storage unavailable */
    }

    queryClient.clear();
    window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
  }, []);

  const fetchSession = useCallback(async (): Promise<SessionResult> => {
    try {
      const meResponse = await getCurrentUser();
      const fetchedUser = meResponse.data.user;
      const fetchedPermissions = meResponse.data.permissions ?? fetchedUser.permissions ?? [];
      return { user: fetchedUser, permissions: fetchedPermissions };
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 401) {
        traceSession(
          "auth-me-401-refresh-attempt",
          {
            code: error.code,
            message: error.message,
          },
          "warn",
        );
        // /auth/me returned 401. Attempt a single refresh, then retry once.
        // If refresh fails, treat as definitively unauthenticated — no more retries.
        try {
          await refreshToken();
          const retryResponse = await getCurrentUser();
          const fetchedUser = retryResponse.data.user;
          const fetchedPermissions =
            retryResponse.data.permissions ?? fetchedUser.permissions ?? [];
          traceSession("auth-me-refresh-retry-succeeded", {
            userId: fetchedUser._id,
            permissionCount: fetchedPermissions.length,
          });
          return { user: fetchedUser, permissions: fetchedPermissions };
        } catch (refreshError) {
          traceSession(
            "auth-me-refresh-retry-failed",
            {
              originalCode: error.code,
              refreshError,
            },
            "warn",
          );
          return { user: null, permissions: [] };
        }
      }

      // Network or server error — deny access defensively.
      traceSession(
        "auth-me-non401-failure",
        {
          error,
        },
        "warn",
      );
      return { user: null, permissions: [] };
    }
  }, []);

  /**
   * Validates the session via GET /auth/me (with one refresh retry on 401).
   *
   * STABLE: its dep array contains only the four stable callbacks above.
   * All mutable state is read from sessionRef.current, not from closure.
   * This prevents useEffect([validateSession]) from re-firing on every
   * state update, which was the root cause of the infinite polling loop.
   */
  const validateSession = useCallback(
    async ({
      force = false,
      staleMs = DEFAULT_STALE_MS,
      redirectIfUnauthenticated = true,
      redirectAuthenticatedFromPublic = true,
      blocking = !hasBootstrappedRef.current,
    }: {
      force?: boolean;
      staleMs?: number;
      redirectIfUnauthenticated?: boolean;
      redirectAuthenticatedFromPublic?: boolean;
      // Full-screen loader should only be used during initial bootstrap.
      blocking?: boolean;
    } = {}): Promise<SessionResult> => {
      // Read current session state from the ref (not from closure-captured state).
      const snap = sessionRef.current;

      const isFresh =
        !force &&
        snap.lastValidatedAt !== null &&
        Date.now() - snap.lastValidatedAt <= staleMs &&
        snap.user !== null;

      if (isFresh) {
        traceSession("validate-session-used-cache", {
          staleMs,
          pathname: snap.pathname,
        });
        return { user: snap.user, permissions: snap.permissions };
      }

      // Coalesce concurrent validation calls — return the in-flight promise.
      if (validationInFlight.current) {
        return validationInFlight.current;
      }

      const shouldBlock = blocking && !hasBootstrappedRef.current;
      if (shouldBlock) {
        setLoading(true);
      }

      // Cleanup is inside the IIFE so it runs regardless of how the promise settles,
      // and so callers who await the returned promise see it resolve after cleanup.
      const pending = (async (): Promise<SessionResult> => {
        try {
          traceSession("validate-session-fetch-start", {
            force,
            staleMs,
            pathname: sessionRef.current.pathname,
            blocking: shouldBlock,
          });
          const result = await fetchSession();
          if (result.user) {
            applySession(result.user, result.permissions);
            if (redirectAuthenticatedFromPublic && isPublicAuthPath(sessionRef.current.pathname)) {
              navigate(getAuthenticatedHomeUrl(result.permissions, result.user.roleName), {
                replace: true,
              });
            }
          } else {
            traceSession(
              "validate-session-no-user",
              {
                pathname: sessionRef.current.pathname,
                redirectIfUnauthenticated,
              },
              "warn",
            );
            clearSession();
            // Read pathname from ref at this point (user may have navigated).
            if (redirectIfUnauthenticated && isPrivatePath(sessionRef.current.pathname)) {
              navigate("/login", { replace: true, state: null });
            }
          }
          return result;
        } finally {
          if (shouldBlock) {
            setLoading(false);
          }
          hasBootstrappedRef.current = true;
          validationInFlight.current = null;
        }
      })();

      validationInFlight.current = pending;
      return pending;
    },
    // IMPORTANT: no state values here. Adding user/permissions/lastValidatedAt
    // would cause validateSession to get a new reference on every state change,
    // and the mount effect below would re-fire, creating an infinite poll loop.
    [applySession, clearSession, fetchSession, navigate],
  );

  const checkAuth = useCallback(async (): Promise<SessionResult> => {
    return validateSession({ force: true, blocking: !hasBootstrappedRef.current });
  }, [validateSession]);

  const ensureSession = useCallback(
    async ({ force = false, staleMs = DEFAULT_STALE_MS } = {}): Promise<boolean> => {
      // Route-level revalidation is silent to avoid flashing global loaders.
      const result = await validateSession({ force, staleMs, blocking: false });
      return result.user !== null;
    },
    [validateSession],
  );

  // STABLE: reads from sessionRef so it needs no state in dep array.
  const isSessionStale = useCallback((staleMs = DEFAULT_STALE_MS): boolean => {
    const ts = sessionRef.current.lastValidatedAt;
    if (ts === null) return true;
    return Date.now() - ts > staleMs;
  }, []);

  // Initial session check — run exactly ONCE on mount.
  // validateSession is stable (no state in its dep array), so including it
  // here does not cause re-fires.
  useEffect(() => {
    void validateSession({ force: true, blocking: true });
  }, [validateSession]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user && isPublicAuthPath(location.pathname)) {
      navigate(getAuthenticatedHomeUrl(permissions, user.roleName), { replace: true });
      return;
    }

    if (!user && isPrivatePath(location.pathname)) {
      navigate("/login", { replace: true, state: null });
    }
  }, [loading, location.pathname, navigate, permissions, user]);

  // Register the global 401-failure handler in the HTTP client.
  // Reads pathname from sessionRef at the time of failure — no location dep needed.
  useEffect(() => {
    setAuthFailureHandler(async () => {
      traceSession(
        "auth-failure-handler-invoked",
        {
          pathname: sessionRef.current.pathname,
        },
        "warn",
      );
      clearSession();
      if (isPrivatePath(sessionRef.current.pathname)) {
        navigate("/login", { replace: true, state: null });
      }
    });

    return () => {
      setAuthFailureHandler(null);
    };
  }, [clearSession, navigate]);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isLoggedIn: isAuthenticated,
        isLoading: loading,
        permissions,
        lastValidatedAt,
        checkAuth,
        ensureSession,
        isSessionStale,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
