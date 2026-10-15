import { Button, Icons } from '@web/components/atoms';
import { Card, StatusResult } from '@web/components/molecules';

export interface ProgrammeLoadErrorProps {
  /** Fetches the programme again */
  onRetry: () => void;
}

/** Shown when the member's programme could not be fetched, as distinct from having none. */
export const ProgrammeLoadError: React.FC<ProgrammeLoadErrorProps> = ({ onRetry }) => (
  <Card>
    <StatusResult
      icon={Icons.ALERTTRIANGLE}
      iconVariant="warning"
      title="We couldn't load your programme just now."
      actions={
        <Button variant="primary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  </Card>
);
