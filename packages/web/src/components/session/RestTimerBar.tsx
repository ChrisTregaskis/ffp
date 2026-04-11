import { useEffect, useRef, useState } from 'react';

import { FadeSlide } from '@web/components/motion';
import { ProgressBar } from '@web/components/ProgressBar';
import { Text } from '@web/components/text/Text';
import { formatDuration } from '@web/utils/format';

export interface RestTimerBarProps {
  /** Total rest duration in seconds */
  seconds: number;
  /** Called when the timer reaches zero */
  onComplete: () => void;
}

/**
 * Horizontal rest timer bar that sits below the session header.
 *
 * Shows remaining time and a progress bar counting down.
 * Exercise content remains visible and interactive beneath.
 * Cancel is handled by the Rest/Cancel Rest toggle button on the exercise panel.
 */
export const RestTimerBar: React.FC<RestTimerBarProps> = ({ seconds, onComplete }) => {
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

  const progressPercent = (remaining / seconds) * 100;

  return (
    <FadeSlide>
      <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-4 py-2">
        <Text as="span" styleProps={{ size: 'sm', weight: 'semibold' }}>
          Rest
        </Text>

        <ProgressBar
          percent={progressPercent}
          duration={1}
          ease="linear"
          delay={0}
          animateFromZero={false}
          className="flex-1"
        />

        <Text as="span" styleProps={{ size: 'sm', weight: 'bold' }} className="tabular-nums">
          {formatDuration(remaining)}
        </Text>
      </div>
    </FadeSlide>
  );
};
