import type { ProgrammeDetailResponse } from '@ffp/core';

import type { StatusCircleStatus } from '@web/components/atoms';
import { Badge, StatusCircle, Text, Title } from '@web/components/atoms';
import { Card } from '@web/components/molecules';

import { ProgressSummary } from './ProgressSummary';

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
): StatusCircleStatus => {
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
          <Badge label="Current" variant="brand" appearance="solid" shape="md" />
          <Title as="h4">
            Phase {String(phase.phaseNumber)}: {phase.name ?? `Phase ${String(phase.phaseNumber)}`}
          </Title>
        </div>
        {phase.description && (
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-2">
            {phase.description}
          </Text>
        )}

        <ProgressSummary
          label="Phase Progress"
          count={`${String(completedSessions)} of ${String(phase.sessions.length)} sessions`}
          percent={progressPercent}
          className="mb-4 mt-4"
        />

        {/* Session dots */}
        <div className="flex flex-wrap gap-2">
          {phase.sessions.map((session) => {
            const status = getSessionDotStatus(session, currentSessionNumber);

            return (
              <StatusCircle
                key={session.templateSessionId}
                number={session.sessionNumber}
                status={status}
                size="md"
                aria-label={`Step ${String(session.sessionNumber)}: ${status}`}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
};
