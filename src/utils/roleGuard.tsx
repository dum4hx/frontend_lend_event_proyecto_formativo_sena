/**
 * Higher-order component for role-based access control.
 * Wraps components to ensure only users with required roles can access them.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { LoadingSpinner } from "../components/ui";
import { useHasRole } from "./roleGuardHooks";

export interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * Component that restricts access based on user role.
 * Redirects unauthorized users to a specified path.
 */
export function RequireRole({
  children,
  allowedRoles,
  redirectTo = "/unauthorized",
}: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // User is not authenticated
        navigate("/login", { replace: true });
      } else if (!user.roleName || !allowedRoles.includes(user.roleName.toLowerCase())) {
        // User doesn't have required role
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, isLoading, allowedRoles, navigate, redirectTo]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner fullScreen message="Verifying access…" />;
  }

  // User is not authenticated (will redirect in useEffect)
  if (!user) {
    return <LoadingSpinner fullScreen message="Verifying access…" />;
  }

  // User doesn't have required roleName (logic will redirect in useEffect)
  if (!user.roleName || !allowedRoles.includes(user.roleName.toLowerCase())) {
    return <LoadingSpinner fullScreen message="Verifying access…" />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

/**
 * Component for inline conditional rendering based on role.
 *
 * @example
 * ```tsx
 * <RoleGuard allowedRoles={['super_admin', 'owner']}>
 *   <AdminButton />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}) {
  const hasRole = useHasRole(allowedRoles);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
