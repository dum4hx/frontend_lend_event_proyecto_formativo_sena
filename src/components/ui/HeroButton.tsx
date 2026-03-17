import React, { type ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./HeroButton.module.css";

export type HeroButtonVariant = "primary" | "secondary";

export interface HeroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Large hero style variant */
  variant?: HeroButtonVariant;
  /** Whether to show the glow animation (true by default for primary) */
  glow?: boolean;
  /** Full-width button on all screen sizes */
  fullWidth?: boolean;
}

/**
 * Reusable HeroButton component for public-facing landing pages,
 * login, and registration screens. Implements larger padding,
 * rounded corners, and optional glow animations.
 */
const HeroButton = forwardRef<HTMLButtonElement, HeroButtonProps>(
  (
    { variant = "primary", glow = true, fullWidth = false, className = "", children, ...props },
    ref,
  ) => {
    const baseStyles =
      "px-10 py-4 font-extrabold text-lg transition-all duration-300 rounded-xl relative overflow-hidden active:scale-[0.98] inline-flex items-center justify-center";

    const variantStyles: Record<HeroButtonVariant, string> = {
      primary: `bg-[#FFD700] text-black shadow-xl hover:bg-yellow-300 ${glow ? styles.glowEffect : ""}`,
      secondary:
        "bg-transparent border border-gray-700 text-white hover:bg-gray-900/50 hover:border-gray-500",
    };

    const widthStyle = fullWidth ? "w-full" : "w-full sm:w-auto";

    const combinedClassName =
      `${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`.trim();

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  },
);

HeroButton.displayName = "HeroButton";

export default HeroButton;
