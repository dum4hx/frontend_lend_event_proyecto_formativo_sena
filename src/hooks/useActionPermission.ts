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
import { useLanguage } from "../contexts/useLanguage";

export interface ActionPermissionGuard {
  /**
   * Wraps `handler` so it only executes when the user holds `permission`.
   * If the user lacks the permission a warning toast is shown and the
   * handler is NOT called.
   */
  guard: (permission: string, handler: () => void, deniedMessage?: string) => () => void;

  /** True when the user holds the given permission. */
  isAllowed: (permission: string) => boolean;
}

export function useActionPermission(locale?: "en" | "es"): ActionPermissionGuard {
  const { hasPermission } = usePermissions();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const effectiveLocale = locale ?? language;

  const isAllowed = useCallback(
    (permission: string): boolean => hasPermission(permission),
    [hasPermission],
  );

  const guard = useCallback(
    (permission: string, handler: () => void, deniedMessage?: string): (() => void) => {
      return () => {
        if (hasPermission(permission)) {
          handler();
        } else {
          showToast(
            "warning",
            deniedMessage ?? t("actionPermission.denied"),
            t("actionPermission.deniedTitle"),
            { duration: 4000 },
          );
        }
      };
    },
    [hasPermission, showToast, effectiveLocale, t],
  );

  return { guard, isAllowed };
}
