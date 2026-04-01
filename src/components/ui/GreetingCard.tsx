/**
 * GreetingCard — Personalized welcome card after successful login
 *
 * Displays a welcome message with user's name in the bottom-right corner
 * Features:
 * - Smooth slide-in animation from bottom-right
 * - Auto-dismisses after 6 seconds
 * - Hover to pause auto-dismiss
 * - Keyboard dismissible (Escape)
 * - Personalized with user name
 */

import React, { useEffect, useRef, useCallback } from "react";
import { X, Sparkles } from "lucide-react";

export interface GreetingCardProps {
  /** User's display name */
  name: string;
  /** Translation key: "es" for Spanish, "en" for English */
  language: "es" | "en";
  /** Callback when card is dismissed */
  onDismiss?: () => void;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

const MESSAGES = {
  es: {
    greeting: "¡Bienvenido de nuevo!",
    subtitle: "Tu panel está listo para usar",
  },
  en: {
    greeting: "Welcome back!",
    subtitle: "Your dashboard is ready to use",
  },
};

export const GreetingCard: React.FC<GreetingCardProps> = ({
  name,
  language,
  onDismiss,
  action,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messages = MESSAGES[language];

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    if (!isVisible || isPaused) return;

    timerRef.current = setTimeout(() => {
      dismiss();
    }, 6000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, isPaused, dismiss]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        dismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, dismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`transform transition-all duration-500 ${
        isVisible ? "translate-x-0 translate-y-0 opacity-100" : "translate-x-96 translate-y-96 opacity-0"
      }`}
    >
      <div
        className="fixed bottom-6 right-6 z-[9998] max-w-sm pointer-events-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="status"
        aria-live="polite"
      >
        <div className="bg-gradient-to-br from-yellow-400/95 to-yellow-500/95 border border-yellow-300 rounded-2xl shadow-2xl p-6 backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-yellow-900 hover:text-yellow-950 transition-colors"
            aria-label={language === "es" ? "Cerrar" : "Close"}
          >
            <X size={20} />
          </button>

          {/* Header with icon and greeting */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-300/30 rounded-lg">
              <Sparkles size={24} className="text-yellow-900" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-yellow-900">{messages.greeting}</h3>
              <p className="text-sm text-yellow-800/80">{messages.subtitle}</p>
            </div>
          </div>

          {/* User name */}
          <div className="text-center py-3 px-4 bg-yellow-300/20 rounded-lg mb-4">
            <p className="text-sm font-semibold text-yellow-900/70">
              {language === "es" ? "Saludos para" : "Welcome"},{" "}
              <span className="font-bold text-yellow-900">{name}</span>
            </p>
          </div>

          {/* Action button if provided */}
          {action && (
            <button
              onClick={async () => {
                await action.onClick();
                dismiss();
              }}
              className="w-full py-2 px-4 bg-yellow-900 text-white font-bold rounded-lg hover:bg-yellow-950 transition-colors text-sm"
            >
              {action.label}
            </button>
          )}

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-yellow-300/40 rounded-full overflow-hidden">
            <div
              className="bg-yellow-900 h-full animate-pulse"
              style={{
                animation: "shrink 6s linear forwards",
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
