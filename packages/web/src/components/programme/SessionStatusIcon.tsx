import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text/Text';

export interface SessionStatusIconProps {
  /** Whether the session is completed */
  isCompleted: boolean;
  /** Whether this is the next session to start/continue */
  isNext: boolean;
  /** Session number displayed for default (not started) state */
  sessionNumber: number;
}

const BASE_CLASSES = 'flex h-5 w-5 items-center justify-center rounded-full';

/**
 * Small status circle for a session row.
 *
 * - Completed: green with white checkmark
 * - Next: dark-blue with white dot
 * - Default: bordered with session number
 */
export const SessionStatusIcon: React.FC<SessionStatusIconProps> = ({
  isCompleted,
  isNext,
  sessionNumber,
}) => {
  if (isCompleted) {
    return (
      <span className={`${BASE_CLASSES} bg-ffp-green`}>
        <Icon name={Icons.CHECK} styleProps={{ size: 'xs', colour: '#ffffff' }} />
      </span>
    );
  }

  if (isNext) {
    return (
      <span className={`${BASE_CLASSES} bg-ffp-dark-blue`}>
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    );
  }

  return (
    <span className={`${BASE_CLASSES} border-2 border-border`}>
      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>{String(sessionNumber)}</Text>
    </span>
  );
};
