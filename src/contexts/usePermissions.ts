import { useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { isOwnerRoleName, isRestrictedOwnerAction } from "../config/ownerRestrictions";

/**
 * Access the current user's permissions from the auth context.
 *
 * @throws if used outside `<AuthProvider>`.
 */
export function usePermissions() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("usePermissions must be used within an <AuthProvider>");
  }

  const { permissions, user } = ctx;
  const isOwnerUser = isOwnerRoleName(user?.roleName);

  /** Exact match — returns `true` when the user holds the given permission. */
  const hasPermission = useCallback(
    (key: string): boolean => {
      if (!permissions.includes(key)) return false;
      if (isOwnerUser && isRestrictedOwnerAction(key)) return false;
      return true;
    },
    [permissions, isOwnerUser],
  );

  /** Returns `true` when the user holds **at least one** of the listed permissions. */
  const hasAnyPermission = useCallback(
    (keys: string[]): boolean => keys.some((k) => hasPermission(k)),
    [hasPermission],
  );

  /** Returns `true` when the user holds **all** of the listed permissions. */
  const hasAllPermissions = useCallback(
    (keys: string[]): boolean => keys.every((k) => hasPermission(k)),
    [hasPermission],
  );

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}
