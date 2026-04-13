import { useNavigate } from 'react-router-dom';

import type { ProgrammeDetailResponse } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text/Text';

import { SessionStatusIcon } from './SessionStatusIcon';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

export interface SessionRowProps {
  /** Session data from programme detail response */
  session: Session;
  /** Phase publicId for session navigation */
  phasePublicId: string;
  /** Whether this is the next session the user should start/continue */
  isNext: boolean;
}

/**
 * Session item within an expanded phase card.
 *
 * Displays session name, exercise count, estimated duration, and status icon.
 * The next session gets a highlighted background and a Start/Continue button
 * that navigates to the session workout page.
 */
export const SessionRow: React.FC<SessionRowProps> = ({ session, phasePublicId, isNext }) => {
  const navigate = useNavigate();
  const status = session.userSession?.status;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';

  const handleStart = (): void => {
    void navigate(`/programme/session/${phasePublicId}/${session.templateSessionPublicId}`);
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
        isNext ? 'bg-ffp-dark-blue/5' : isCompleted ? 'bg-muted/30' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          <SessionStatusIcon
            isCompleted={isCompleted}
            isNext={isNext}
            sessionNumber={session.sessionNumber}
          />
        </span>

        {/* Session details */}
        <>
          <Text
            styleProps={{
              size: 'sm',
              weight: isNext ? 'medium' : 'normal',
              colour: isCompleted ? 'muted-foreground' : 'foreground',
            }}
          >
            {session.name ?? `Session ${String(session.sessionNumber)}`}
          </Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {String(session.exerciseCount)} exercises
            {session.estimatedDurationMinutes
              ? ` · ${String(session.estimatedDurationMinutes)} min`
              : ''}
          </Text>
        </>
      </div>

      {isNext && (
        <Button variant="primary" size="sm" onClick={handleStart}>
          <Icon name={Icons.PLAY} styleProps={{ size: 'xs', colour: '#ffffff' }} />
          {isInProgress ? 'Continue' : 'Start'}
        </Button>
      )}
    </div>
  );
};
