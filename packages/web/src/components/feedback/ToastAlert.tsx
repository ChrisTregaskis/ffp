import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { IconButton } from '@web/components/button/IconButton';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text';

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
  /** Callback when toast should be dismissed */
  onDismiss: (id: string) => void;
  /** Additional custom classes */
  className?: string;
}

/** Variant configuration mapping variant to icon and background colour */
const VARIANT_CONFIG: Record<ToastVariant, { icon: Icons; bg: string; border: string }> = {
  success: {
    icon: Icons.CHECKCIRCLE,
    bg: 'bg-success',
    border: 'border-success',
  },
  error: {
    icon: Icons.ALERTCIRCLE,
    bg: 'bg-destructive',
    border: 'border-destructive',
  },
  warning: {
    icon: Icons.ALERTTRIANGLE,
    bg: 'bg-warning',
    border: 'border-warning',
  },
  info: {
    icon: Icons.HELPCIRCLE,
    bg: 'bg-info',
    border: 'border-info',
  },
};

/**
 * Auto-dismissing toast notification component.
 *
 * Displays temporary, non-blocking notifications with solid colour
 * backgrounds, white text, entrance/exit animations, and an auto-dismiss
 * progress bar. Use for status updates, background operation completions,
 * and transient feedback.
 *
 * Exit animation is handled by the parent AnimatePresence in ToastProvider.
 * Do not wrap this component in its own AnimatePresence.
 *
 * For persistent, blocking alerts use StaticAlert instead.
 */
export const ToastAlert: React.FC<ToastAlertProps> = ({
  id,
  variant = 'info',
  message,
  duration = 5000,
  onDismiss,
  className = '',
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (duration <= 0) {
      return;
    }

    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [id, duration, onDismiss]);

  const { icon, bg, border } = VARIANT_CONFIG[variant];

  return (
    <motion.div
      layout
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`pointer-events-auto w-80 overflow-hidden rounded-md border shadow-lg ${bg} ${border} ${className}`.trim()}
    >
      <div className="flex items-center p-3">
        <Icon name={icon} styleProps={{ size: 'sm', colour: 'var(--color-white)' }} />
        <Text as="p" styleProps={{ colour: 'white', size: 'sm' }} className="ml-3 flex-1">
          {message}
        </Text>
        <IconButton
          icon={Icons.CLOSE}
          size="sm"
          colour="var(--color-white)"
          ariaLabel="Dismiss notification"
          onClick={() => {
            onDismiss(id);
          }}
          className="ml-2 opacity-80 hover:opacity-100"
        />
      </div>

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div className="h-0.5 w-full bg-white/20">
          <motion.div
            className="h-full bg-white/60"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
          />
        </div>
      )}
    </motion.div>
  );
};
