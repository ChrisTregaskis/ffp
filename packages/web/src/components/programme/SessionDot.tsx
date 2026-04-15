import { StepIndicator } from './StepIndicator';

type SessionDotStatus = 'completed' | 'current' | 'upcoming';

export interface SessionDotProps {
  /** Session number (1-based) */
  sessionNumber: number;
  /** Visual status of the session dot */
  status: SessionDotStatus;
}

/**
 * Session status dot for the phase detail card.
 *
 * Thin wrapper over StepIndicator with md size and light context.
 */
export const SessionDot: React.FC<SessionDotProps> = ({ sessionNumber, status }) => (
  <StepIndicator stepNumber={sessionNumber} status={status} size="md" context="light" />
);
