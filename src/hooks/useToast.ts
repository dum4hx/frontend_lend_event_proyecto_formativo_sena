/**
 * useToast — Hook for managing toast notifications
 *
 * Usage:
 * const { toasts, showToast, dismissToast } = useToast();
 * showToast('success', 'Operation completed!');
 */

import { useState, useCallback, useRef } from 'react';
import type { Toast, ToastType } from '../components/ui/ToastContainer';

let toastIdCounter = 0;

export interface UseToastReturn {
  toasts: Toast[];
  showToast: (
    type: ToastType,
    message: string,
    title?: string,
    options?: Partial<Toast>
  ) => string;
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const showToast = useCallback(
    (
      type: ToastType,
      message: string,
      title?: string,
      options?: Partial<Toast>
    ): string => {
      toastIdCounter++;
      const id = `toast-${toastIdCounter}-${Date.now()}`;
      const toast: Toast = {
        id,
        type,
        message,
        title,
        duration: 5000,
        ...options,
      };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return { toasts, showToast, dismissToast, clearAll };
}
