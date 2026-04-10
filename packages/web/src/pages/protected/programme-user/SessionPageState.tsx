import { Button } from '@web/components/button';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { SessionCompletionState } from '@web/components/session';
import { Text } from '@web/components/text/Text';

export type SessionState = 'loading' | 'not-found' | 'needs-start' | 'completed' | 'workout';

export interface SessionPageStateProps {
  /** Current page state */
  state: 'loading' | 'not-found' | 'needs-start' | 'completed';
  /** Session name (for needs-start and completed states) */
  sessionName?: string;
  /** Whether the start mutation is pending */
  isStarting?: boolean;
  /** Number of exercises completed (for completed state) */
  exercisesCompleted?: number;
  /** Estimated duration in minutes (for completed state) */
  estimatedDurationMinutes?: number | null;
  /** Called when "Start Session" is clicked */
  onStart?: () => void;
  /** Called when "Back to Programme" is clicked (completed state) */
  onBackToProgramme: () => void;
}

/**
 * Non-workout states for the session page.
 *
 * Handles loading, not found, session start, and completion states
 * so the main SessionPage can focus on the workout flow.
 */
export const SessionPageState: React.FC<SessionPageStateProps> = ({
  state,
  sessionName,
  isStarting = false,
  exercisesCompleted = 0,
  estimatedDurationMinutes,
  onStart,
  onBackToProgramme,
}) => {
  switch (state) {
    case 'loading':
      return (
        <div className="flex h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );

    case 'not-found':
      return (
        <div className="flex h-screen items-center justify-center">
          <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
            Session not found.
          </Text>
        </div>
      );

    case 'needs-start':
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
            {sessionName ?? 'Session'}
          </Text>
          <Button
            variant="primary"
            size="lg"
            onClick={onStart}
            loading={isStarting}
            disabled={isStarting}
          >
            Start Session
          </Button>
        </div>
      );

    case 'completed':
      return (
        <div className="flex h-screen">
          <SessionCompletionState
            sessionName={sessionName ?? 'Session'}
            exercisesCompleted={exercisesCompleted}
            estimatedDurationMinutes={estimatedDurationMinutes ?? null}
            onBackToProgramme={onBackToProgramme}
          />
        </div>
      );
  }
};
