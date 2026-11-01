import type { ProgrammeReadiness } from '@ffp/core';

import { Button, Text } from '@web/components/atoms';
import { ErrorRetryState, StaticAlert } from '@web/components/molecules';
import { ClickScale } from '@web/components/motion';

import { ProgrammeNotReadyNotice } from './ProgrammeNotReadyNotice';

export interface ResultsActionsProps {
  isReassessment: boolean;
  /** Whether scores have arrived; replacing needs them */
  hasScores: boolean;
  programmeReadiness: ProgrammeReadiness;
  isReplacing: boolean;
  /** Replacing failed; the member keeps their current programme */
  hasReplaceFailed: boolean;
  /** Checking whether the programme is ready failed, so readiness can't move on by itself */
  hasReadinessCheckFailed?: boolean;
  onRetryReadinessCheck?: () => void;
  onViewProgramme: () => void;
  onKeepProgramme?: () => void;
  onReplaceProgramme?: () => void;
}

export const ResultsActions: React.FC<ResultsActionsProps> = ({
  isReassessment,
  hasScores,
  programmeReadiness,
  isReplacing,
  hasReplaceFailed,
  hasReadinessCheckFailed = false,
  onRetryReadinessCheck,
  onViewProgramme,
  onKeepProgramme,
  onReplaceProgramme,
}) => {
  if (isReassessment) {
    return (
      <div className="flex flex-col items-center gap-3 pt-4">
        {hasReplaceFailed && (
          <StaticAlert
            variant="info"
            appearance="soft"
            message="We couldn't update your programme just now. Your current programme is still here for you."
          />
        )}
        <div className="flex gap-3">
          <ClickScale>
            <Button
              variant="secondary"
              size="lg"
              onClick={onReplaceProgramme}
              disabled={!hasScores || isReplacing || hasReplaceFailed}
            >
              {isReplacing ? 'Replacing...' : 'Replace My Programme'}
            </Button>
          </ClickScale>
          <ClickScale>
            <Button variant="primary" size="lg" onClick={onKeepProgramme} disabled={isReplacing}>
              Keep Current Programme
            </Button>
          </ClickScale>
        </div>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Choose to update your programme or keep your existing one.
        </Text>
      </div>
    );
  }

  if (programmeReadiness === 'failed') {
    return <ProgrammeNotReadyNotice />;
  }

  if (programmeReadiness === 'pending' && hasReadinessCheckFailed && onRetryReadinessCheck) {
    return (
      <ErrorRetryState
        title="We couldn't check on your programme just now."
        onRetry={onRetryReadinessCheck}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      <ClickScale>
        <Button
          variant="primary"
          size="lg"
          onClick={onViewProgramme}
          disabled={programmeReadiness !== 'ready'}
        >
          View My Programme
        </Button>
      </ClickScale>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Your assessment results and programme will be saved to your account.
      </Text>
    </div>
  );
};
