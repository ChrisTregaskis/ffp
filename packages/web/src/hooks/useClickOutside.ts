import { useEffect, useRef } from 'react';

import type { RefObject } from 'react';

/**
 * Hook that detects clicks outside one or more referenced elements.
 *
 * @param ref - Ref to the container element, or refs to several (a trigger and a portalled panel, say)
 * @param onClickOutside - Callback fired on a click outside every referenced element
 * @param enabled - Whether the listener is active (defaults to true)
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement | null> | readonly RefObject<HTMLElement | null>[],
  onClickOutside: () => void,
  enabled = true
): void => {
  const callbackRef = useRef(onClickOutside);
  callbackRef.current = onClickOutside;

  // Held in a ref so an inline array does not re-attach the listener every render
  const refsRef = useRef(ref);
  refsRef.current = ref;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleMouseDown = (event: MouseEvent): void => {
      const refs = 'current' in refsRef.current ? [refsRef.current] : refsRef.current;
      const elements = refs.flatMap((each) => (each.current ? [each.current] : []));
      const target = event.target as Node;

      if (elements.length > 0 && elements.every((element) => !element.contains(target))) {
        callbackRef.current();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [enabled]);
};
