import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCooldownTimerReturn {
  /** Current cooldown value in seconds (0 when inactive) */
  cooldown: number;
  /** Start the cooldown timer */
  startCooldown: () => void;
  /** Whether the cooldown is currently active */
  isActive: boolean;
}

/**
 * Hook for managing a countdown timer with automatic cleanup.
 *
 * Useful for rate-limiting UI actions like resending verification codes.
 *
 * @param durationSeconds - Cooldown duration in seconds
 */
export const useCooldownTimer = (durationSeconds: number): UseCooldownTimerReturn => {
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCooldown = useCallback((): void => {
    setCooldown(durationSeconds);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }, [durationSeconds]);

  return { cooldown, startCooldown, isActive: cooldown > 0 };
};
