import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { IconButton } from '@web/components/button/IconButton';
import { Icon, type IconColour } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text, type TextColour } from '@web/components/text';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'top-centre' | 'bottom-right' | 'bottom-centre';

export interface ToastAlertProps {
  /** Unique identifier for the toast */
  id: string;
  /** Toast variant determining colour and icon */
  variant?: ToastVariant;
  /** Toast message to display */
  message: string;
  /** Auto-dismiss duration in milliseconds @default 5000 */
  duration?: number;
  /** Whether the toast is currently visible */
  visible: boolean;
  /** Callback when toast should be dismissed */
  onDismiss: (id: string) => void;
  /** Additional custom classes */
  className?: string;
}

/** Appearance styling for a given variant */
interface ToastStyleConfig {
  bg: string;
  border: string;
  iconColour: IconColour;
  textColour: TextColour;
  dismissClass: string;
  progressColour: string;
}

/**
 * Variant configuration for ToastAlert.
 *
 * Uses soft styling (translucent tinted background with coloured text)
 * consistent with StaticAlert's soft appearance.
 */
const VARIANT_CONFIG: Record<ToastVariant, { icon: Icons; style: ToastStyleConfig }> = {
  success: {
    icon: Icons.CHECKCIRCLE,
    style: {
      bg: 'bg-success/20',
      border: 'border-success/40',
      iconColour: 'var(--color-success)',
      textColour: 'success',
      dismissClass: 'opacity-60 hover:opacity-100',
      progressColour: 'bg-success',
    },
  },
  error: {
    icon: Icons.ALERTCIRCLE,
    style: {
      bg: 'bg-destructive/20',
      border: 'border-destructive/40',
      iconColour: 'var(--color-destructive)',
      textColour: 'destructive',
      dismissClass: 'opacity-60 hover:opacity-100',
      progressColour: 'bg-destructive',
    },
  },
  warning: {
    icon: Icons.ALERTTRIANGLE,
    style: {
      bg: 'bg-warning/20',
      border: 'border-warning/40',
      iconColour: 'var(--color-warning)',
      textColour: 'warning',
      dismissClass: 'opacity-60 hover:opacity-100',
      progressColour: 'bg-warning',
    },
  },
  info: {
    icon: Icons.HELPCIRCLE,
    style: {
      bg: 'bg-info/20',
      border: 'border-info/40',
      iconColour: 'var(--color-info)',
      textColour: 'info',
      dismissClass: 'opacity-60 hover:opacity-100',
      progressColour: 'bg-info',
    },
  },
};

/**
 * Auto-dismissing toast notification component.
 *
 * Displays temporary, non-blocking notifications with entrance/exit
 * animations and an auto-dismiss progress bar. Use for status updates,
 * background operation completions, and transient feedback.
 *
 * For persistent, blocking alerts use StaticAlert instead.
 */
export const ToastAlert: React.FC<ToastAlertProps> = ({
  id,
  variant = 'info',
  message,
  duration = 5000,
  visible,
  onDismiss,
  className = '',
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible || duration <= 0) return;

    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, visible, duration, onDismiss]);

  const { icon, style } = VARIANT_CONFIG[variant];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          layout
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`pointer-events-auto w-80 overflow-hidden rounded-md border shadow-lg ${style.bg} ${style.border} ${className}`.trim()}
        >
          <div className="flex items-center p-3">
            <Icon name={icon} styleProps={{ size: 'sm', colour: style.iconColour }} />
            <Text
              as="p"
              styleProps={{ colour: style.textColour, size: 'sm' }}
              className="ml-3 flex-1"
            >
              {message}
            </Text>
            <IconButton
              icon={Icons.CLOSE}
              size="sm"
              ariaLabel="Dismiss notification"
              onClick={() => {
                onDismiss(id);
              }}
              className={`ml-2 ${style.dismissClass}`}
            />
          </div>

          {/* Auto-dismiss progress bar */}
          {duration > 0 && (
            <div className="h-0.5 w-full bg-black/5">
              <motion.div
                className={`h-full ${style.progressColour}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
