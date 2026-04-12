import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { PrescriptionBadge } from '@web/components/programme/PrescriptionBadge';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

export interface SessionStartScreenProps {
  /** Session name */
  sessionName: string;
  /** Session description */
  sessionDescription?: string | null;
  /** Phase context (e.g., "Phase 1 of 4: Gentle Awareness") */
  phaseContext?: string;
  /** Number of exercises in the session */
  exerciseCount: number;
  /** Estimated duration in minutes */
  estimatedDurationMinutes?: number | null;
  /** Whether the start mutation is pending */
  isStarting: boolean;
  /** Called when "Start Session" is clicked */
  onStart?: () => void;
  /** Called when "Back" is clicked */
  onBack: () => void;
}

/**
 * Pre-session screen shown before a workout begins.
 *
 * Displays session context (phase, name, description, exercise count, duration)
 * with Start Session and Back CTAs.
 */
export const SessionStartScreen: React.FC<SessionStartScreenProps> = ({
  sessionName,
  sessionDescription,
  phaseContext,
  exerciseCount,
  estimatedDurationMinutes,
  isStarting,
  onStart,
  onBack,
}) => (
  <div className="flex h-screen flex-col items-center justify-center px-6 text-center">
    {phaseContext && (
      <Text
        as="p"
        styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
        className="mb-2 uppercase tracking-wide"
      >
        {phaseContext}
      </Text>
    )}
    <Title as="h1" className="mb-2">
      {sessionName}
    </Title>
    {sessionDescription && (
      <Text
        as="p"
        styleProps={{ size: 'base', colour: 'muted-foreground' }}
        className="mb-6 max-w-xl"
      >
        {sessionDescription}
      </Text>
    )}
    <div className="mb-8 flex gap-2">
      {exerciseCount > 0 && (
        <PrescriptionBadge
          label={`${String(exerciseCount)} exercises`}
          icon={Icons.REPEAT}
          variant="blue"
          size="md"
        />
      )}
      {estimatedDurationMinutes && (
        <PrescriptionBadge
          label={`${String(estimatedDurationMinutes)} min`}
          icon={Icons.CLOCK}
          variant="blue"
          size="md"
        />
      )}
    </div>
    <div className="flex gap-3">
      <Button variant="neutral" size="lg" onClick={onBack}>
        Back
      </Button>
      <Button
        variant="primary"
        size="lg"
        icon={<Icon name={Icons.PLAY} styleProps={{ size: 'sm', colour: '#ffffff' }} />}
        onClick={onStart}
        loading={isStarting}
        disabled={isStarting}
      >
        Start Session
      </Button>
    </div>
  </div>
);
