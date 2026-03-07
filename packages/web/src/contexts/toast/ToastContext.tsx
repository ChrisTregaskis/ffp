import { AnimatePresence } from 'motion/react';
import { useCallback, useRef, useState } from 'react';

import { ToastAlert, type ToastPosition } from '@web/components/feedback/ToastAlert';

import { ToastContext, type ToastItem, type ToastOptions } from './toast.definitions';

import type { ReactNode } from 'react';

/** Position classes for toast container */
const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-centre': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-centre': 'bottom-4 left-1/2 -translate-x-1/2',
};

/** Default auto-dismiss duration */
const DEFAULT_DURATION = 5000;

/** Maximum concurrent toasts displayed */
const MAX_TOASTS = 5;

export interface ToastProviderProps {
  children: ReactNode;
  /** Position of the toast container @default 'top-right' */
  position?: ToastPosition;
}

/**
 * Toast notification provider.
 *
 * Wrap your application (or a subtree) with this provider to enable
 * toast notifications via the useToast hook. Renders a positioned
 * container that displays auto-dismissing toast alerts.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
}) => {
  const toastCounter = useRef(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, options?: ToastOptions): string => {
    const id = `toast-${String(++toastCounter.current)}`;
    const newToast: ToastItem = {
      id,
      message,
      variant: options?.variant ?? 'info',
      duration: options?.duration ?? DEFAULT_DURATION,
    };

    setToasts((prev) => {
      const updated = [...prev, newToast];

      // Trim oldest toasts if over limit
      if (updated.length > MAX_TOASTS) {
        return updated.slice(updated.length - MAX_TOASTS);
      }

      return updated;
    });

    return id;
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast, dismissAll }}>
      {children}

      {/* Toast container */}
      <div
        className={`pointer-events-none fixed z-50 flex flex-col gap-2 ${POSITION_CLASSES[position]}`}
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastAlert
              key={toast.id}
              id={toast.id}
              variant={toast.variant}
              message={toast.message}
              duration={toast.duration}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
