import { useAuth } from '../contexts/useAuth';

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
export function useHasRole(role: string | string[]): boolean {
  const { user } = useAuth();
  
  if (!user || !user.roleName) return false;
  
  const userRole = user.roleName.toLowerCase();

  if (Array.isArray(role)) {
    return role.some(r => r.toLowerCase() === userRole);
  }
  
  return userRole === role.toLowerCase();
}