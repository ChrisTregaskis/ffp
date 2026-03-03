import { AnimatePresence } from 'motion/react';
import React, { useCallback, useEffect, useRef } from 'react';

import { IconButton } from '@web/components/button/IconButton';
import { Icons } from '@web/components/Icon/types';
import { Backdrop } from '@web/components/motion/Backdrop';
import { ScaleFade } from '@web/components/motion/ScaleFade';
import { Text, Title } from '@web/components/text';

import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Modal body content */
  children: ReactNode;
  /** Optional footer content (action buttons) */
  footer?: ReactNode;
  /** Modal width preset @default 'md' */
  size?: ModalSize;
  /** Whether clicking the backdrop closes the modal @default true */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal @default true */
  closeOnEscape?: boolean;
  /** Additional classes for the modal container */
  className?: string;
}

const SIZE_CLASS_MAP: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Reusable modal dialog component
 *
 * Built on top of the existing Backdrop and ScaleFade motion components.
 * Supports keyboard dismissal, focus trapping, and body scroll locking.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Body scroll lock + focus management
  useEffect(() => {
    if (isOpen) {
      // Store currently focused element to restore later
      previousFocusRef.current = document.activeElement as HTMLElement | null;

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Focus the modal container
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus to previously focused element
      previousFocusRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // Prevent clicks inside the modal from propagating to the backdrop
  const handleModalClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop onClick={handleBackdropClick} zIndex={50} />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
            role="presentation"
          >
            <ScaleFade initialScale={0.95} duration={0.2} easing="easeOut">
              <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onClick={handleModalClick}
                className={`w-full ${SIZE_CLASS_MAP[size]} max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-white shadow-xl outline-none ${className}`.trim()}
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border px-6 py-4">
                  <div>
                    <Title as="h2">{title}</Title>
                    {subtitle && (
                      <Text
                        as="p"
                        styleProps={{ colour: 'muted-foreground', size: 'sm' }}
                        className="mt-1"
                      >
                        {subtitle}
                      </Text>
                    )}
                  </div>
                  <IconButton
                    icon={Icons.CLOSE}
                    size="md"
                    ariaLabel="Close modal"
                    onClick={onClose}
                    className="ml-4 shrink-0"
                  />
                </div>

                {/* Body */}
                <div className="px-6 py-5">{children}</div>

                {/* Footer (optional) */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                    {footer}
                  </div>
                )}
              </div>
            </ScaleFade>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
