/**
 * PermissionGuardedButton — An IconButton that enforces a permission check.
 *
 * - When the user **has** the permission: behaves exactly like IconButton.
 * - When the user **lacks** the permission: renders visually disabled,
 *   shows a tooltip explaining why, and fires a warning toast if clicked.
 *
 * Uses `aria-disabled` (not the native `disabled` attr) so the click target
 * remains interactive for the denied-toast feedback while still conveying
 * the disabled semantic to assistive technology.
 *
 * Usage:
 * ```tsx
 * <PermissionGuardedButton
 *   icon={Pencil}
 *   intent="edit"
 *   ariaLabel="Edit member"
 *   requiredPermission="users:update"
 *   onClick={() => openEdit(member)}
 * />
 * ```
 */

import React from "react";
import { ShieldOff } from "lucide-react";
import { useActionPermission } from "../../hooks/useActionPermission";
import { useLanguage } from "../../contexts/useLanguage";
import type { IconButtonIntent } from "./IconButton";

export interface PermissionGuardedButtonProps {
  /** Lucide icon component (not a JSX element). */
  icon: React.ElementType;
  /** Visual intent. */
  intent?: IconButtonIntent;
  /** Screen-reader label for the allowed state. */
  ariaLabel: string;
  /** The permission key required to perform this action. */
  requiredPermission: string;
  /** Custom message shown in the toast when the user is denied. */
  deniedMessage?: string;
  /** Handler called only if the user has the required permission. */
  onClick?: () => void;
  /** Extra class names on the button. */
  className?: string;
}

const intentStyles: Record<IconButtonIntent, string> = {
  edit: "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10",
  delete: "text-red-500 hover:text-red-400 hover:bg-red-500/10",
  view: "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10",
  close: "text-zinc-500 hover:text-white hover:bg-white/10",
  approve: "text-green-400 hover:text-green-300 hover:bg-green-400/10",
  reject: "text-red-400 hover:text-red-300 hover:bg-red-400/10",
  neutral: "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-400/10",
  secondary: "text-zinc-500 hover:text-white hover:bg-white/10",
};

export function PermissionGuardedButton({
  icon,
  intent = "neutral",
  ariaLabel,
  requiredPermission,
  deniedMessage,
  onClick,
  className = "",
}: PermissionGuardedButtonProps) {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { guard, isAllowed } = useActionPermission(isEs ? "es" : "en");

  const allowed = isAllowed(requiredPermission);

  const defaultDenied = isEs
    ? "No tienes permiso para realizar esta acción."
    : "You don't have permission to perform this action.";

  const tooltipText = allowed
    ? ariaLabel
    : (deniedMessage ?? defaultDenied);

  const handleClick = allowed
    ? onClick
    : guard(requiredPermission, onClick ?? (() => undefined), deniedMessage);

  const disabledStyles = !allowed
    ? "opacity-40 cursor-not-allowed !hover:bg-transparent"
    : "active:scale-90";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-disabled={!allowed}
      title={tooltipText}
      onClick={handleClick}
      className={`relative p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${intentStyles[intent]} ${disabledStyles} ${className}`}
    >
      {React.createElement(icon, { className: "w-4 h-4", "aria-hidden": "true" })}
      {/* Lock badge for visually indicating denied state */}
      {!allowed && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-700">
          <ShieldOff className="w-2 h-2 text-zinc-500" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
