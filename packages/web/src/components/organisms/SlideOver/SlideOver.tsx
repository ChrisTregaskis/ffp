import { AnimatePresence } from 'motion/react';
import React, { useRef } from 'react';

import { IconButton, Icons, Text, Title } from '@web/components/atoms';
import { Backdrop } from '@web/components/motion/Backdrop';
import { SlideDrawer } from '@web/components/motion/SlideDrawer';
import { useBodyScrollLock } from '@web/hooks/useBodyScrollLock';
import { useFocusTrap } from '@web/hooks/useFocusTrap';
import { useKeyDown } from '@web/hooks/useKeyDown';

import type { ReactNode } from 'react';

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** A right-hand panel over the page; behaves as a modal dialog. */
export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useKeyDown('Escape', onClose, isOpen);
  useFocusTrap(panelRef, isOpen);
  useBodyScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop onClick={onClose} zIndex={50} opacity={0.4} />
          <SlideDrawer
            position="right"
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl bg-card shadow-xl"
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              tabIndex={-1}
              className="flex h-full flex-col outline-none"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
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
                  ariaLabel="Close panel"
                  onClick={onClose}
                  className="shrink-0"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            </div>
          </SlideDrawer>
        </>
      )}
    </AnimatePresence>
  );
};
