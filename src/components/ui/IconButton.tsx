import React, { type ButtonHTMLAttributes, forwardRef } from "react";

export type IconButtonIntent =
  | "edit"
  | "delete"
  | "view"
  | "close"
  | "approve"
  | "reject"
  | "neutral"
  | "secondary"; // Add secondary

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The icon to render */
  icon: React.ElementType; // Change from ReactNode to ElementType
  /** Visual intent for the action */
  intent?: IconButtonIntent;
  /** Accessibility label for screen readers */
  ariaLabel: string;
}

/**
 * Reusable IconButton component for icon-only actions.
 * Standardizes color palettes for edit, delete, view, and close.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, intent = "neutral", ariaLabel, className = "", ...props }, ref) => {
    const baseStyles =
      "p-2 rounded-lg transition-all duration-200 flex items-center justify-center";

    const intentStyles: Record<IconButtonIntent, string> = {
      edit: "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 active:scale-90",
      delete: "text-red-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90",
      view: "text-[#FFD700] hover:text-[#FFC107] hover:bg-[#FFD700]/10 active:scale-95",
      close: "text-gray-500 hover:text-white hover:bg-white/10 active:scale-95",
      approve: "text-green-400 hover:text-green-300 hover:bg-green-400/10 active:scale-95",
      reject: "text-red-400 hover:text-red-300 hover:bg-red-400/10 active:scale-95",
      neutral: "text-gray-400 hover:text-gray-300 hover:bg-gray-400/10 active:scale-95",
      secondary: "text-gray-500 hover:text-white hover:bg-white/10 active:scale-95",
    };

    const combinedClassName = `${baseStyles} ${intentStyles[intent]} ${className}`.trim();

    // Updated return for safety
    return (
      <button ref={ref} aria-label={ariaLabel} className={combinedClassName} {...props}>
        {icon && React.createElement(icon, { className: "w-4 h-4", "aria-hidden": "true" })}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
