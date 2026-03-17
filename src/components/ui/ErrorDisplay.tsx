/**
 * Reusable error display component with retry functionality.
 * Provides clear error feedback and recovery options.
 */

import { AlertCircle } from "lucide-react";
import type { NormalizedError } from "../../utils/errorHandling";
import Button from "./Button";

export interface ErrorDisplayProps {
  error: string | NormalizedError;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorDisplay({ error, onRetry, fullScreen = false }: ErrorDisplayProps) {
  const normalizedError =
    typeof error === "string" ? { message: error, isTemporary: false, canRetry: false } : error;

  const content = (
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={32} className="text-red-400" />
      </div>

      <p className="text-red-400 mb-4 leading-relaxed">{normalizedError.message}</p>

      {normalizedError.code && (
        <p className="text-xs text-gray-500 mb-4">Error code: {normalizedError.code}</p>
      )}

      <div className="flex items-center justify-center gap-3">
        {onRetry && normalizedError.canRetry && (
          <Button onClick={onRetry} size="lg">
            Retry
          </Button>
        )}
        <Button variant="secondary" onClick={() => window.history.back()} size="lg">
          Go Back
        </Button>
      </div>

      {normalizedError.isTemporary && (
        <p className="text-xs text-gray-500 mt-4">
          This appears to be a temporary issue. Please try again in a moment.
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return <div className="flex items-center justify-center min-h-[60vh]">{content}</div>;
  }

  return <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8">{content}</div>;
}
