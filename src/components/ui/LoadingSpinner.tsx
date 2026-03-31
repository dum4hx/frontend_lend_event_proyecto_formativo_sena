/**
 * Reusable loading spinner component with optional message.
 * Provides consistent loading states across the application.
 */

import { useLanguage } from "../../contexts/useLanguage";

export interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  xs: "h-4 w-4 border-2",
  sm: "h-6 w-6 border-2",
  md: "h-12 w-12 border-2",
  lg: "h-16 w-16 border-3",
};

export function LoadingSpinner({ size = "md", message, fullScreen = false }: LoadingSpinnerProps) {
  const { t } = useLanguage();
  const spinner = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full border-gray-700 border-t-[#FFD700] mx-auto mb-4 ${sizeClasses[size]}`}
        role="status"
        aria-label={t("common.loading")}
      />
      {message && <p className="text-gray-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="flex items-center justify-center min-h-[60vh]">{spinner}</div>;
  }

  return spinner;
}
