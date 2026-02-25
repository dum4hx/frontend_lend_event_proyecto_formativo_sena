/**
 * ToastContainer — Modern toast notifications with animations
 *
 * Features:
 * - Smooth slide-in/fade animations
 * - Auto-dismiss with progress bar
 * - Multiple toast support (stacked)
 * - Hover to pause auto-dismiss
 * - Keyboard dismissible (Escape)
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void;
}

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP = {
  success: {
    bg: 'bg-green-950/80',
    border: 'border-green-800',
    icon: 'text-green-400',
    text: 'text-green-50',
    progress: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-950/80',
    border: 'border-red-800',
    icon: 'text-red-400',
    text: 'text-red-50',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-950/80',
    border: 'border-amber-800',
    icon: 'text-amber-400',
    text: 'text-amber-50',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-950/80',
    border: 'border-blue-800',
    icon: 'text-blue-400',
    text: 'text-blue-50',
    progress: 'bg-blue-500',
  },
};

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300); // Allow animation to complete
  }, [id, onDismiss]);

  useEffect(() => {
    if (!isVisible || isPaused || duration === Infinity) return;

    startTimeRef.current = Date.now();
    let elapsed = 0;

    // Auto-dismiss timer
    timerRef.current = setTimeout(() => {
      dismiss();
    }, duration);

    // Progress bar animation
    progressRef.current = setInterval(() => {
      elapsed += 50;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isVisible, isPaused, duration, dismiss]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, dismiss]);

  const colors = COLOR_MAP[type];
  const IconComponent = ICON_MAP[type];

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`${colors.bg} border ${colors.border} rounded-lg shadow-2xl p-4 mb-4 max-w-md backdrop-blur-sm`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="alert"
        aria-live={type === 'error' ? 'assertive' : 'polite'}
      >
        <div className="flex gap-3">
          <IconComponent className={`${colors.icon} flex-shrink-0 mt-0.5`} size={20} />
          
          <div className="flex-1 min-w-0">
            {title && (
              <p className={`font-semibold ${colors.text} text-sm mb-1`}>
                {title}
              </p>
            )}
            <p className={`${colors.text} text-sm opacity-90 break-words`}>
              {message}
            </p>
            {action && (
              <button
                onClick={async () => {
                  await action.onClick();
                  dismiss();
                }}
                className={`mt-2 px-4 py-2 rounded ${colors.bg} border ${colors.border} ${colors.icon} hover:opacity-80 transition-colors font-semibold`}
              >
                {action.label}
              </button>
            )}
          </div>

          <button
            onClick={dismiss}
            className={`${colors.icon} flex-shrink-0 hover:opacity-70 transition-opacity`}
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        {duration !== Infinity && (
          <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
            <div
              className={`${colors.progress} h-full transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};
