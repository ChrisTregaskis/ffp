import type { ProgrammeDetailResponse } from '@ffp/core';

import { Card } from '@web/components/Card/Card';
import { ProgressBar } from '@web/components/ProgressBar';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

import { SessionDot } from './SessionDot';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

export interface PhaseDetailCardProps {
  /** Current phase from programme detail */
  phase: Phase;
  /** Current phase progress percentage (0–100) */
  progressPercent: number;
}

/** Derive the visual status for a session dot */
const getSessionDotStatus = (
  session: Session,
  currentSessionNumber: number | null
): 'completed' | 'current' | 'upcoming' => {
  const userStatus = session.userSession?.status;

  if (userStatus === 'completed' || userStatus === 'skipped') {
    return 'completed';
  }

  if (userStatus === 'in_progress' || session.sessionNumber === currentSessionNumber) {
    return 'current';
  }

  return 'upcoming';
};

/** Find the first uncompleted session number in the phase */
const findCurrentSessionNumber = (sessions: Session[]): number | null => {
  const firstUncompleted = sessions.find((s) => {
    const status = s.userSession?.status;

    return !status || status === 'not_started' || status === 'in_progress';
  });

  return firstUncompleted?.sessionNumber ?? null;
};

/**
 * Current phase detail card for the dashboard.
 *
 * Shows the current phase name, a progress bar, session count,
 * and session dots (green checkmark = complete, dark-blue = current, grey = upcoming).
 */
export const PhaseDetailCard: React.FC<PhaseDetailCardProps> = ({ phase, progressPercent }) => {
  const currentSessionNumber = findCurrentSessionNumber(phase.sessions);
  const completedSessions = phase.sessions.filter((s) => {
    const status = s.userSession?.status;

    return status === 'completed' || status === 'skipped';
  }).length;

  return (
    <Card>
      <div className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-ffp-dark-blue px-2 py-0.5 text-xs font-medium text-white">
            Current
          </span>
          <Title as="h4">
            Phase {String(phase.phaseNumber)}: {phase.name ?? `Phase ${String(phase.phaseNumber)}`}
          </Title>
        </div>

        <div className="mb-2 mt-4 flex items-center justify-between">
          <Text
            styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
            className="uppercase tracking-wide"
          >
            Phase Progress
          </Text>
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>
            {String(completedSessions)} of {String(phase.sessions.length)} sessions
          </Text>
        </div>
        <ProgressBar percent={progressPercent} className="mb-4" />

        {/* Session dots */}
        <div className="flex flex-wrap gap-2">
          {phase.sessions.map((session) => (
            <SessionDot
              key={session.templateSessionId}
              sessionNumber={session.sessionNumber}
              status={getSessionDotStatus(session, currentSessionNumber)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};
