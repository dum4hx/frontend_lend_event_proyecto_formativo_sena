/**
 * useAlerts — Hook for managing a stack of alert notifications.
 *
 * Provides helpers to show/dismiss alerts and an alerts array
 * to render with <AlertContainer />.
 */

import { useState, useCallback, useRef } from 'react';
import type { AlertItem, AlertType } from '../components/ui/AlertCard';

let globalIdCounter = 0;

export interface UseAlertsReturn {
  alerts: AlertItem[];
  showAlert: (type: AlertType, message: string, title?: string, options?: Partial<AlertItem>) => string;
  dismissAlert: (id: string) => void;
  clearAll: () => void;
}

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const showAlert = useCallback(
    (type: AlertType, message: string, title?: string, options?: Partial<AlertItem>): string => {
      globalIdCounter++;
      const id = `alert-${globalIdCounter}-${Date.now()}`;
      const alert: AlertItem = {
        id,
        type,
        message,
        title,
        ...options,
      };
      setAlerts((prev) => [...prev, alert]);
      return id;
    },
    [],
  );

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, showAlert, dismissAlert, clearAll };
}
