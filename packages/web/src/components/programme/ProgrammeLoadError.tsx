import { Card, ErrorRetryState } from '@web/components/molecules';

export interface ProgrammeLoadErrorProps {
  /** Fetches the programme again */
  onRetry: () => void;
}

/** Shown when the member's programme could not be fetched, as distinct from having none. */
export const ProgrammeLoadError: React.FC<ProgrammeLoadErrorProps> = ({ onRetry }) => (
  <Card>
    <ErrorRetryState title="We couldn't load your programme just now." onRetry={onRetry} />
  </Card>
);
