/**
 * useAlertModal — Hook for showing alert modals imperatively.
 * 
 * Provides a simple API to replace browser alert() calls:
 * - showSuccess(message, title?)
 * - showInfo(message, title?)
 * - showWarning(message, title?)
 * - showError(message, title?)
 * 
 * Returns a component to render in your JSX.
 */

import { useState, useCallback } from 'react';
import { AlertModal, type AlertModalType } from '../components/ui/AlertModal';

interface AlertState {
  open: boolean;
  type: AlertModalType;
  title?: string;
  message: string;
}

export function useAlertModal() {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    type: 'info',
    message: '',
  });

  const closeModal = useCallback(() => {
    setAlert((prev) => ({ ...prev, open: false }));
  }, []);

  const showAlert = useCallback((type: AlertModalType, message: string, title?: string) => {
    setAlert({
      open: true,
      type,
      title,
      message,
    });
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert('success', message, title);
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert('info', message, title);
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert('warning', message, title);
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert('error', message, title);
  }, [showAlert]);

  const AlertModalComponent = useCallback(() => (
    <AlertModal
      open={alert.open}
      type={alert.type}
      title={alert.title}
      message={alert.message}
      onClose={closeModal}
    />
  ), [alert, closeModal]);

  return {
    showSuccess,
    showInfo,
    showWarning,
    showError,
    AlertModal: AlertModalComponent,
  };
}
