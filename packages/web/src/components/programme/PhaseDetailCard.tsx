import type { ProgrammeDetailResponse } from '@ffp/core';

import type { StatusCircleStatus } from '@web/components/atoms';
import { Badge, StatusCircle, Text, Title } from '@web/components/atoms';
import { Card } from '@web/components/molecules';
import { countDoneSessions, findNextSession, isSessionDone } from '@web/utils/programme';

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
  if (isSessionDone(session)) {
    return 'completed';
  }

  if (
    session.userSession?.status === 'in_progress' ||
    session.sessionNumber === currentSessionNumber
  ) {
    return 'current';
  }

  return 'upcoming';
};

/**
 * Current phase detail card for the dashboard.
 *
 * Shows the current phase name, a progress bar, session count,
 * and session dots (green checkmark = complete, dark-blue = current, grey = upcoming).
 */
export const PhaseDetailCard: React.FC<PhaseDetailCardProps> = ({ phase, progressPercent }) => {
  const currentSessionNumber = findNextSession(phase)?.sessionNumber ?? null;
  const doneSessions = countDoneSessions(phase.sessions);

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
          count={`${String(doneSessions)} of ${String(phase.sessions.length)} sessions`}
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
