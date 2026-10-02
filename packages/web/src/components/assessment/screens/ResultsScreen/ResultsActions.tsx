import { Button } from '@web/components/button';
import { ClickScale } from '@web/components/motion';
import { Text } from '@web/components/text';

export interface ResultsActionsProps {
  isReassessment: boolean;
  /** Whether scores have arrived; replacing needs them */
  hasScores: boolean;
  programmeId: string | null;
  isReplacing: boolean;
  onViewProgramme: () => void;
  onKeepProgramme?: () => void;
  onReplaceProgramme?: () => void;
}

export const ResultsActions: React.FC<ResultsActionsProps> = ({
  isReassessment,
  hasScores,
  programmeId,
  isReplacing,
  onViewProgramme,
  onKeepProgramme,
  onReplaceProgramme,
}) => {
  if (isReassessment) {
    return (
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="flex gap-3">
          <ClickScale>
            <Button
              variant="secondary"
              size="lg"
              onClick={onReplaceProgramme}
              disabled={!hasScores || isReplacing}
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

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      <ClickScale>
        <Button
          variant="primary"
          size="lg"
          onClick={onViewProgramme}
          disabled={programmeId === null}
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
