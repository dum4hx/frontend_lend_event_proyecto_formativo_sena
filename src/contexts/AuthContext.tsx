/**
 * Authentication context.
 *
 * Provides the currently-authenticated user (or null) to the
 * entire component tree and exposes a `checkAuth` helper that
 * pages call after login / logout to refresh the state.
 */

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getCurrentUser } from "../services/authService";
import { ApiError } from "../lib/api";
import type { User } from "../types/api";

// -- Context shape -----------------------------------------------------------

interface AuthContextValue {
  /** The logged-in user, or `null` when unauthenticated. */
  user: User | null;
  /** Shorthand boolean for `user !== null`. */
  isLoggedIn: boolean;
  /** `true` while the initial auth check is still in-flight. */
  isLoading: boolean;
  /**
   * Re-fetch /auth/me and update the context.
   * Call this after login or logout to sync the UI.
   * Returns the fetched user, or `null` if unauthenticated.
   */
  checkAuth: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// -- Provider ----------------------------------------------------------------

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      const response = await getCurrentUser();
      setUser(response.data.user);
      return response.data.user;
    } catch (error: unknown) {
      // 401 is expected when the user is not logged in.
      if (error instanceof ApiError && error.statusCode === 401) {
        setUser(null);
      } else {
        // Network or unexpected errors -- still clear the user.
        console.error("[AuthContext] Failed to verify session:", error);
        setUser(null);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth once on mount.
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: user !== null, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
