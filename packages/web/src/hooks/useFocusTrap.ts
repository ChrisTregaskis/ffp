import { useEffect } from 'react';

import { getFocusableElements } from '@web/utils/focusable';

import type { RefObject } from 'react';

/**
 * Hook that keeps keyboard focus inside a container while it is active.
 *
 * Focuses the container when it activates, cycles Tab and Shift+Tab through its focusable
 * descendants, and returns focus to whatever held it before, whether the trap is
 * disabled or the component unmounts.
 *
 * @param ref - Ref to the container element; it needs `tabIndex={-1}` to take initial focus
 * @param enabled - Whether the trap is active (defaults to true)
 */
export const useFocusTrap = (ref: RefObject<HTMLElement | null>, enabled = true): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // The container may mount inside an entering animation, so wait a frame
    const frame = requestAnimationFrame(() => {
      ref.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent): void => {
      const container = ref.current;

      if (event.key !== 'Tab' || !container) {
        return;
      }

      const focusable = getFocusableElements(container);
      const first = focusable.at(0);
      const last = focusable.at(-1);
      const active = document.activeElement;
      const isInside = active instanceof Node && container.contains(active);

      if (!first || !last) {
        event.preventDefault();
        container.focus();

        return;
      }

      if (event.shiftKey && (!isInside || active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!isInside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [ref, enabled]);
};
