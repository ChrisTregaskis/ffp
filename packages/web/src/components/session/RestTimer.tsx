import { useEffect, useRef, useState } from 'react';

import { Button } from '@web/components/button';
import { FadeSlide } from '@web/components/motion';
import { Text } from '@web/components/text/Text';

export interface RestTimerProps {
  /** Total rest duration in seconds */
  seconds: number;
  /** Called when the timer reaches zero */
  onComplete: () => void;
  /** Called when the user clicks "Skip Rest" */
  onSkip: () => void;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular SVG countdown timer for rest periods.
 *
 * Replaces exercise content inline (not overlay).
 * User-initiated — no auto-advance after completion.
 */
export const RestTimer: React.FC<RestTimerProps> = ({ seconds, onComplete, onSkip }) => {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          onComplete();

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onComplete]);

  const progress = ((seconds - remaining) / seconds) * 100;
  const strokeOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <FadeSlide className="flex flex-col items-center justify-center gap-6">
      {/* Circular progress */}
      <div className="relative h-48 w-48">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-ffp-primary-blue)" />
              <stop offset="100%" stopColor="var(--color-ffp-dark-blue)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Centre display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Text as="span" styleProps={{ size: '4xl', weight: 'bold' }}>
            {String(remaining)}
          </Text>
        </div>
      </div>

      {/* Skip button */}
      <Button variant="secondary" size="md" onClick={onSkip}>
        Skip Rest
      </Button>
    </FadeSlide>
  );
};
