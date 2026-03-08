import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { usePermissions } from "../contexts/usePermissions";
import { LoadingSpinner } from "../components/ui";

export interface RequirePermissionProps {
  children: React.ReactNode;
  /** The user must hold at least ONE of these permissions (OR logic). */
  requiredPermissions: string[];
  redirectTo?: string;
}

/**
 * Route guard that gates access based on backend permissions.
 *
 * - Unauthenticated users are sent to `/login`.
 * - Authenticated users lacking the required permissions are sent to
 *   `redirectTo` (defaults to `/unauthorized`).
 */
export function RequirePermission({
  children,
  requiredPermissions,
  redirectTo = "/unauthorized",
}: RequirePermissionProps) {
  const { user, isLoading, isLoggedIn } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const navigate = useNavigate();

  const hasAccess = requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions);

  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    } else if (!hasAccess) {
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isLoggedIn, hasAccess, navigate, redirectTo]);

  if (isLoading || !user) {
    return <LoadingSpinner fullScreen message="Verifying access…" />;
  }

  if (!hasAccess) {
    return <LoadingSpinner fullScreen message="Verifying access…" />;
  }

  return <>{children}</>;
}
