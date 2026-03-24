import React, { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button dimensions */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Optional icon component to display on the left */
  leftIcon?: React.ElementType;
  /** Optional icon component to display on the right */
  rightIcon?: React.ElementType;
}

/**
 * Reusable Button component for the LendEvent design system.
 * Standardizes primary, secondary, danger, and success actions.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles: Record<ButtonVariant, string> = {
      primary: "bg-[#FFD700] text-black shadow-md hover:bg-[#FFC107] active:scale-[0.98]",
      secondary:
        "bg-[#1a1a1a] text-gray-300 border border-[#333] hover:bg-[#252525] hover:text-white",
      danger: "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
      success: "bg-green-600 text-white hover:bg-green-500 active:scale-[0.98]",
      outline:
        "bg-transparent text-gray-300 border border-gray-600 hover:border-[#FFD700] hover:text-[#FFD700] transition-colors",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-3 py-1 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-base gap-2",
    };

    const combinedClassName =
      `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    return (
      <button ref={ref} disabled={disabled || loading} className={combinedClassName} {...props}>
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          <>
            {LeftIcon && <LeftIcon className="w-4 h-4" />}
            {children}
            {RightIcon && <RightIcon className="w-4 h-4" />}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
