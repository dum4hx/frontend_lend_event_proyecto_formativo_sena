/**
 * Higher-order component for role-based access control.
 * Wraps components to ensure only users with required roles can access them.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { LoadingSpinner } from '../components/ui';
import type { UserRole } from '../types/api';

export interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Component that restricts access based on user role.
 * Redirects unauthorized users to a specified path.
 */
export function RequireRole({ children, allowedRoles, redirectTo = '/unauthorized' }: RequireRoleProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // User is not authenticated
        navigate('/login', { replace: true });
      } else if (!allowedRoles.includes(user.role)) {
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

  // User doesn't have required role (will redirect in useEffect)
  if (!allowedRoles.includes(user.role)) {
    return <LoadingSpinner fullScreen message="Verifying access…" />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
}

/**
 * Higher-order component to wrap a component with role-based access control.
 * 
 * @example
 * ```tsx
 * const SuperAdminPage = withRoleGuard(MyComponent, ['super_admin']);
 * ```
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  redirectTo?: string
): React.FC<P> {
  return function GuardedComponent(props: P) {
    return (
      <RequireRole allowedRoles={allowedRoles} redirectTo={redirectTo}>
        <Component {...props} />
      </RequireRole>
    );
  };
}

/**
 * Hook to check if the current user has a specific role.
 * Useful for conditional rendering within components.
 * 
 * @example
 * ```tsx
 * const isSuperAdmin = useHasRole('super_admin');
 * if (isSuperAdmin) {
 *   return <AdminPanel />;
 * }
 * ```
 */
export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
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
  fallback = null 
}: { 
  children: React.ReactNode; 
  allowedRoles: UserRole[]; 
  fallback?: React.ReactNode;
}) {
  const hasRole = useHasRole(allowedRoles);
  
  if (!hasRole) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
