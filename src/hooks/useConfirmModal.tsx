/**
 * useConfirmModal — Hook for showing confirmation dialogs imperatively.
 * 
 * Replaces browser confirm() calls with a stylized modal dialog.
 * Provides promise-based API for awaiting user's choice.
 * 
 * Example:
 * ```tsx
 * const { showConfirm, ConfirmModal } = useConfirmModal();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Delete Item?',
 *     message: 'This action cannot be undone.',
 *     variant: 'danger',
 *   });
 *   
 *   if (confirmed) {
 *     // Perform deletion
 *   }
 * };
 * 
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmModal />
 *   </>
 * );
 * ```
 */

import { useState, useCallback } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

export function useConfirmModal() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true);
    }
    closeModal();
  }, [state, closeModal]);

  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false);
    }
    closeModal();
  }, [state, closeModal]);

  const ConfirmModalComponent = useCallback(() => (
    <ConfirmDialog
      isOpen={state.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
    />
  ), [state, handleCancel, handleConfirm]);

  return {
    showConfirm,
    ConfirmModal: ConfirmModalComponent,
  };
}
