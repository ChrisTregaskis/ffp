import { useEffect, useRef } from 'react';

/**
 * Listen for a specific key press and invoke a callback.
 *
 * Uses a ref for the callback so the listener never re-attaches
 * when the callback identity changes.
 *
 * @example
 * ```tsx
 * useKeyDown('Escape', onCancel);
 * ```
 */
export const useKeyDown = (key: string, callback: () => void): void => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === key) {
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key]);
};
