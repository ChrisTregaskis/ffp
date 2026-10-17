import { useEffect } from 'react';

/** Restores the value it replaced, so stacked overlays unlock in the order they close. */
export const useBodyScrollLock = (enabled: boolean): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [enabled]);
};
