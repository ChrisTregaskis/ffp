import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

type SessionDotStatus = 'completed' | 'current' | 'upcoming';

export interface SessionDotProps {
  /** Session number (1-based) */
  sessionNumber: number;
  /** Visual status of the session dot */
  status: SessionDotStatus;
}

/** Session status dot for the phase detail card. */
export const SessionDot: React.FC<SessionDotProps> = ({ sessionNumber, status }) => {
  const baseClasses = 'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium';

  const statusClasses: Record<SessionDotStatus, string> = {
    completed: 'bg-ffp-green text-white',
    current: 'bg-ffp-dark-blue text-white',
    upcoming: 'bg-muted text-muted-foreground',
  };

  const ariaLabels: Record<SessionDotStatus, string> = {
    completed: `Session ${String(sessionNumber)}: completed`,
    current: `Session ${String(sessionNumber)}: current`,
    upcoming: `Session ${String(sessionNumber)}: upcoming`,
  };

  return (
    <div className={`${baseClasses} ${statusClasses[status]}`} aria-label={ariaLabels[status]}>
      {status === 'completed' ? (
        <Icon name={Icons.CHECK} styleProps={{ size: 'xs', colour: '#ffffff' }} />
      ) : (
        String(sessionNumber)
      )}
    </div>
  );
};
