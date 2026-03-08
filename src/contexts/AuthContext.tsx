/**
 * Authentication context.
 *
 * Provides the currently-authenticated user (or null) to the
 * entire component tree and exposes a `checkAuth` helper that
 * pages call after login / logout to refresh the state.
 *
 * Also stores the user's permission list (fetched from /auth/me)
 * and persists it to sessionStorage so page reloads don't break the UI.
 */

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getCurrentUser } from "../services/authService";
import { ApiError } from "../lib/api";
import type { User } from "../types/api";

// -- Storage key -------------------------------------------------------------

const PERMISSIONS_KEY = "lendevent_permissions";

// -- Context shape -----------------------------------------------------------

interface AuthContextValue {
  /** The logged-in user, or `null` when unauthenticated. */
  user: User | null;
  /** Shorthand boolean for `user !== null`. */
  isLoggedIn: boolean;
  /** `true` while the initial auth check is still in-flight. */
  isLoading: boolean;
  /** Flat list of permission keys for the current user. */
  permissions: string[];
  /**
   * Re-fetch /auth/me and update the context (user + permissions).
   * Call this after login or logout to sync the UI.
   * Returns the fetched user and permissions.
   */
  checkAuth: () => Promise<{ user: User | null; permissions: string[] }>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>(loadPersistedPermissions);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<{ user: User | null; permissions: string[] }> => {
    try {
      const response = await getCurrentUser();
      const fetchedUser = response.data.user;
      const fetchedPermissions = response.data.permissions ?? fetchedUser.permissions ?? [];

      setUser(fetchedUser);
      setPermissions(fetchedPermissions);
      persistPermissions(fetchedPermissions);

      return { user: fetchedUser, permissions: fetchedPermissions };
    } catch (error: unknown) {
      // 401 is expected when the user is not logged in.
      if (error instanceof ApiError && error.statusCode === 401) {
        setUser(null);
      } else {
        // Network or unexpected errors -- still clear the user.
        console.error("[AuthContext] Failed to verify session:", error);
        setUser(null);
      }
      setPermissions([]);
      clearPersistedPermissions();
      return { user: null, permissions: [] };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth once on mount.
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: user !== null, isLoading, permissions, checkAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
