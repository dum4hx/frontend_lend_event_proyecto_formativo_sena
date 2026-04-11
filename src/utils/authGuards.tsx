import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "../components/ui";
import { useAuth } from "../contexts/useAuth";
import { useLanguage } from "../contexts/useLanguage";
import { getAuthenticatedHomeUrl } from "./authRoutePolicy";

interface GuardProps {
  children: ReactNode;
}

interface PublicOnlyRouteProps extends GuardProps {
  redirectAuthenticatedTo?: string;
}

const PRIVATE_NAV_STALE_MS = 10 * 60_000;

/**
 * Guard for authenticated areas.
 * Keeps private routes blocked until session status is resolved.
 * Ensures user cannot remain on a private path if they lose authentication
 * (e.g., via 401, bfcache, or tab switching).
 */
export function RequireAuthenticatedRoute({ children }: GuardProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const { loading, isAuthenticated, ensureSession, isSessionStale } = useAuth();

  // On each mount/location change, validate the session is still fresh.
  // If stale, revalidate before rendering private content.
  useEffect(() => {
    async function maybeRevalidate(): Promise<void> {
      if (loading || !isAuthenticated) return;
      if (!isSessionStale(PRIVATE_NAV_STALE_MS)) return;

      // Silent revalidation: no full-screen loading while user is already inside app.
      await ensureSession({ staleMs: PRIVATE_NAV_STALE_MS });
    }

    void maybeRevalidate();
  }, [ensureSession, isAuthenticated, isSessionStale, loading, location.pathname]);

  // Full-screen loader is reserved for the initial app bootstrap only.
  if (loading) {
    return <LoadingSpinner fullScreen message={t("common.verifyingAccess")} />;
  }

  // Not authenticated — send to login with replace to remove this entry from history
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={null} />;
  }

  // Authenticated and session is fresh — render children
  return <>{children}</>;
}

/**
 * Guard for public auth screens (landing, login, sign-up, etc.).
 * Authenticated users are redirected immediately to their dashboard with replace
 * to prevent them from returning via back button.
 * Unauthenticated users can proceed normally.
 */
export function PublicOnlyRoute({ children, redirectAuthenticatedTo }: PublicOnlyRouteProps) {
  const { t } = useLanguage();
  const { loading, isAuthenticated, permissions, user } = useAuth();
  const resolvedRedirect =
    redirectAuthenticatedTo || getAuthenticatedHomeUrl(permissions, user?.roleName);

  // While auth is loading, show a spinner to prevent rendering the auth UI
  // before we know if the user is authenticated
  if (loading) {
    return <LoadingSpinner fullScreen message={t("common.verifyingAccess")} />;
  }

  // Authenticated user on a public page — redirect immediately with replace
  // to ensure they cannot return to this page via back button
  if (isAuthenticated) {
    return <Navigate to={resolvedRedirect} replace />;
  }

  // Unauthenticated — allow to proceed with the public auth page
  return <>{children}</>;
}
