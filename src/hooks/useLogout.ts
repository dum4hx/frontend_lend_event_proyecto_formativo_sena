import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutAllSessions } from "../services/authService";
import { useAuth } from "../contexts/useAuth";
import { ApiError } from "../lib/api";

/**
 * Unified logout flow:
 * - Calls backend to invalidate all sessions (`/auth/logout-all`)
 * - Clears local auth state immediately
 * - Clears transient client storage if needed
 * - Redirects to `/login`
 */
export function useLogout() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();

  const logout = useCallback(async () => {
    try {
      await logoutAllSessions();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Error logging out";
      // Log but continue to clear state locally so user is out of the app
      console.warn("Logout error:", message);
    } finally {
      clearSession();

      // Clean transient purchase state
      try {
        localStorage.removeItem("pendingCheckoutPlan");
      } catch {
        /* storage unavailable */
      }

      navigate("/login", { replace: true, state: null });
    }
  }, [clearSession, navigate]);

  return { logout };
}
