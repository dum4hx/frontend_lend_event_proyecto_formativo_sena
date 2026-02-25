/**
 * ToastContext — Global toast notification context
 * Provides centralized toast management across the application
 */

import React, { createContext, useCallback, useContext, useState, useRef } from 'react';
import type { Toast, ToastType } from '../components/ui/ToastContainer';

let toastIdCounter = 0;

interface ToastContextValue {
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

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, clearAll }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
