/**
 * useActionPermission — Guards UI actions behind permission checks.
 *
 * Returns a `guard` helper that wraps event handlers: if the user
 * lacks the required permission the handler is NOT called and a
 * warning toast is shown instead.
 *
 * Usage:
 * ```tsx
 * const { guard, isAllowed } = useActionPermission();
 *
 * <button
 *   onClick={guard("users:update", () => openEdit(member))}
 *   aria-disabled={!isAllowed("users:update")}
 * >
 *   Edit
 * </button>
 * ```
 */

import { useCallback } from "react";
import { usePermissions } from "../contexts/usePermissions";
import { useToast } from "../contexts/ToastContext";

/** Default denied messages by locale. */
const DEFAULT_DENIED: Record<string, string> = {
  en: "You don't have permission to perform this action.",
  es: "No tienes permiso para realizar esta acción.",
};

export interface ActionPermissionGuard {
  /**
   * Wraps `handler` so it only executes when the user holds `permission`.
   * If the user lacks the permission a warning toast is shown and the
   * handler is NOT called.
   */
  guard: (
    permission: string,
    handler: () => void,
    deniedMessage?: string,
  ) => () => void;

  /** True when the user holds the given permission. */
  isAllowed: (permission: string) => boolean;
}

export function useActionPermission(locale: "en" | "es" = "en"): ActionPermissionGuard {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();

  const isAllowed = useCallback(
    (permission: string): boolean => hasPermission(permission),
    [hasPermission],
  );

  const guard = useCallback(
    (
      permission: string,
      handler: () => void,
      deniedMessage?: string,
    ): (() => void) => {
      return () => {
        if (hasPermission(permission)) {
          handler();
        } else {
          showToast(
            "warning",
            deniedMessage ?? DEFAULT_DENIED[locale],
            locale === "es" ? "Acción no permitida" : "Action Not Allowed",
            { duration: 4000 },
          );
        }
      };
    },
    [hasPermission, showToast, locale],
  );

  return { guard, isAllowed };
}
