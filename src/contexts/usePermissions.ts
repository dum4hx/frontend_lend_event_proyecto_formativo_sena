import { useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";

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

  const { permissions } = ctx;

  /** Exact match — returns `true` when the user holds the given permission. */
  const hasPermission = useCallback(
    (key: string): boolean => permissions.includes(key),
    [permissions],
  );

  /** Returns `true` when the user holds **at least one** of the listed permissions. */
  const hasAnyPermission = useCallback(
    (keys: string[]): boolean => keys.some((k) => permissions.includes(k)),
    [permissions],
  );

  /** Returns `true` when the user holds **all** of the listed permissions. */
  const hasAllPermissions = useCallback(
    (keys: string[]): boolean => keys.every((k) => permissions.includes(k)),
    [permissions],
  );

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}
