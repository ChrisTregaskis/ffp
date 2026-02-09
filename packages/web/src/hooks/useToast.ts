import { useContext } from 'react';

import { ToastContext, type ToastContextType } from '@web/contexts/toast/toast.definitions';

/**
 * Hook to access toast notification functionality.
 *
 * Must be used within a ToastProvider.
 *
 * @example
 * ```tsx
 * const { addToast } = useToast();
 * addToast('Assessment saved successfully', { variant: 'success' });
 * ```
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
