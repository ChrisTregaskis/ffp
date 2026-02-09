import { createContext } from 'react';

import { type ToastVariant } from '@web/components/feedback/ToastAlert';

/** Options for creating a toast notification */
export interface ToastOptions {
  /** Toast variant @default 'info' */
  variant?: ToastVariant;
  /** Auto-dismiss duration in milliseconds @default 5000 */
  duration?: number;
}

/** Internal toast state */
export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  visible: boolean;
}

/** Toast context value exposed via useToast */
export interface ToastContextType {
  /** Show a toast notification */
  addToast: (message: string, options?: ToastOptions) => string;
  /** Manually dismiss a toast by ID */
  dismissToast: (id: string) => void;
  /** Dismiss all active toasts */
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);
