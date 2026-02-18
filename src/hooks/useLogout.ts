import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { useAuth } from "../contexts/useAuth";
import { ApiError } from "../lib/api";

/**
 * Unified logout flow:
 * - Calls backend to clear cookies
 * - Refreshes auth context (`checkAuth`) so the UI updates immediately
 * - Clears transient client storage if needed
 * - Redirects to a safe public page
 */
export function useLogout() {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Error logging out";
      // Log but continue to clear state locally so user is out of the app
      console.warn("Logout error:", message);
    } finally {
      // Ensure context reflects logged-out state without manual refresh
      await checkAuth();

      // Clean transient purchase state
      try { localStorage.removeItem("pendingCheckoutPlan"); } catch {}

      // Redirect to home (public). Could be `/packages` if preferred.
      navigate("/", { replace: true });
    }
  }, [checkAuth, navigate]);

  return { logout };
}
