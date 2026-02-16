/**
 * AlertCard — Reusable, accessible alert/notification component.
 *
 * Features:
 * - Themed variants: success, info, warning, error
 * - Neon color palettes with semi-transparent backgrounds
 * - Auto-dismiss with a smooth decreasing progress bar (default: 10s)
 * - Pause timer on hover and keyboard focus
 * - Dismissable via close button and Escape key
 * - ARIA live region for screen-reader announcements
 * - Fully keyboard navigable
 * - Configurable: duration, persistent mode, progress bar toggle
 *
 * Visual spec: rounded corners, icon left, text area, close button right,
 * bottom progress bar that shrinks from 100% to 0%.
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { EXPORT_I18N } from '../../types/export';

// ─── Types ─────────────────────────────────────────────────────────────────

/** Alert severity variants. */
export type AlertType = 'success' | 'info' | 'warning' | 'error';

/** Configuration props for AlertCard. */
export interface AlertCardProps {
  /** Unique identifier for the alert instance. */
  id?: string;
  /** Alert variant/severity. */
  type: AlertType;
  /** Title text (bold, top line). */
  title?: string;
  /** Body message — string or ReactNode for rich content. */
  message: ReactNode;
  /** Auto-dismiss duration in milliseconds. Default: 10000. Set to 0 for persistent. */
  duration?: number;
  /** Whether to show the progress bar. Default: true (when not persistent). */
  showProgress?: boolean;
  /** If true, the alert will not auto-dismiss. Default: false. */
  persistent?: boolean;
  /** Called when the alert is dismissed (by any mechanism). */
  onDismiss?: () => void;
  /** Additional CSS class names. */
  className?: string;
  /** Whether the alert is visible. Controlled mode. */
  visible?: boolean;
}

// ─── Icon Map ──────────────────────────────────────────────────────────────

const ICONS: Record<AlertType, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

/** ARIA live politeness by type. */
const ARIA_LIVE: Record<AlertType, 'polite' | 'assertive'> = {
  success: 'polite',
  info: 'polite',
  warning: 'polite',
  error: 'assertive',
};

// ─── Component ─────────────────────────────────────────────────────────────

export function AlertCard({
  id,
  type,
  title,
  message,
  duration = 10_000,
  showProgress = true,
  persistent = false,
  onDismiss,
  className = '',
  visible: controlledVisible,
}: AlertCardProps) {
  const [internalVisible, setInternalVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isVisible = controlledVisible ?? internalVisible;
  const effectiveDuration = persistent ? 0 : duration;
  const shouldAutoClose = effectiveDuration > 0;
  const shouldShowProgress = showProgress && shouldAutoClose;

  const dismiss = useCallback(() => {
    setInternalVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  // Auto-dismiss timer with pause support
  useEffect(() => {
    if (!shouldAutoClose || !isVisible) return;

    if (paused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - startTimeRef.current;
      const totalElapsed = elapsedRef.current + delta;
      const remaining = Math.max(0, effectiveDuration - totalElapsed);
      const pct = (remaining / effectiveDuration) * 100;

      setProgress(pct);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        dismiss();
      }
    }, 50);

    return () => {
      if (timerRef.current) {
        // Accumulate elapsed time when cleaning up
        elapsedRef.current += Date.now() - startTimeRef.current;
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shouldAutoClose, isVisible, paused, effectiveDuration, dismiss]);

  // Keyboard: Escape to dismiss
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      }
    },
    [dismiss],
  );

  // Pause on hover/focus
  const handlePause = useCallback(() => {
    if (shouldAutoClose) {
      // Snapshot elapsed before pausing
      elapsedRef.current += Date.now() - startTimeRef.current;
      setPaused(true);
    }
  }, [shouldAutoClose]);

  const handleResume = useCallback(() => {
    if (shouldAutoClose) {
      setPaused(false);
    }
  }, [shouldAutoClose]);

  if (!isVisible) return null;

  const Icon = ICONS[type];
  const ariaLabel = title ?? EXPORT_I18N[`alert.${type}`] ?? type;

  return (
    <div
      ref={containerRef}
      id={id}
      role="alert"
      aria-live={ARIA_LIVE[type]}
      aria-atomic="true"
      aria-label={ariaLabel}
      tabIndex={0}
      className={`alert-card alert-card--${type} ${className}`}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onFocus={handlePause}
      onBlur={handleResume}
      onKeyDown={handleKeyDown}
    >
      {/* Colored overlay */}
      <div className={`alert-card__overlay alert-card__overlay--${type}`} aria-hidden="true" />

      {/* Content */}
      <div className="alert-card__content">
        {/* Icon */}
        <div className={`alert-card__icon alert-card__icon--${type}`} aria-hidden="true">
          <Icon size={22} />
        </div>

        {/* Text */}
        <div className="alert-card__text">
          {title && <p className="alert-card__title">{title}</p>}
          <div className="alert-card__message">{message}</div>
        </div>

        {/* Close button */}
        <button
          type="button"
          className="alert-card__close"
          onClick={dismiss}
          aria-label={EXPORT_I18N['alert.dismiss']}
          tabIndex={0}
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      {shouldShowProgress && (
        <div className="alert-card__progress-track" aria-hidden="true">
          <div
            className={`alert-card__progress-bar alert-card__progress-bar--${type}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Alert Container (for stacking multiple alerts) ────────────────────────

export interface AlertItem {
  id: string;
  type: AlertType;
  title?: string;
  message: ReactNode;
  duration?: number;
  persistent?: boolean;
}

export interface AlertContainerProps {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export function AlertContainer({
  alerts,
  onDismiss,
  position = 'top-right',
}: AlertContainerProps) {
  const positionClasses: Record<string, string> = {
    'top-right': 'alert-container--top-right',
    'top-left': 'alert-container--top-left',
    'bottom-right': 'alert-container--bottom-right',
    'bottom-left': 'alert-container--bottom-left',
    'top-center': 'alert-container--top-center',
  };

  return (
    <div
      className={`alert-container ${positionClasses[position]}`}
      role="region"
      aria-label="Notifications"
    >
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          id={alert.id}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          duration={alert.duration}
          persistent={alert.persistent}
          onDismiss={() => onDismiss(alert.id)}
        />
      ))}
    </div>
  );
}
