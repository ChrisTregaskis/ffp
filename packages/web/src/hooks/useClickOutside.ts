import { useEffect, useRef } from 'react';

import type { RefObject } from 'react';

/**
 * Hook that detects clicks outside a referenced element.
 *
 * @param ref - Ref to the container element
 * @param onClickOutside - Callback fired on outside click
 * @param enabled - Whether the listener is active (defaults to true)
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled = true
): void => {
  const callbackRef = useRef(onClickOutside);
  callbackRef.current = onClickOutside;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleMouseDown = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callbackRef.current();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [ref, enabled]);
};
