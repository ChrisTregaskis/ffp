import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { FadeSlideIn, SpringScale } from '@web/components/motion';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

export interface SessionCompletionStateProps {
  /** Session name */
  sessionName: string;
  /** Number of exercises completed */
  exercisesCompleted: number;
  /** Estimated duration in minutes */
  estimatedDurationMinutes: number | null;
  /** Called when "Back to Programme" is clicked */
  onBackToProgramme: () => void;
}

/**
 * Congratulations screen shown when all exercises in a session are completed.
 *
 * Staggered animations for checkmark, title, stats, and button.
 */
export const SessionCompletionState: React.FC<SessionCompletionStateProps> = ({
  sessionName,
  exercisesCompleted,
  estimatedDurationMinutes,
  onBackToProgramme,
}) => (
  <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
    {/* Checkmark */}
    <SpringScale
      initialScale={0}
      stiffness={200}
      damping={15}
      delay={0.2}
      className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ffp-green"
    >
      <Icon name={Icons.CHECK} styleProps={{ size: 'xl', colour: '#ffffff' }} />
    </SpringScale>

    {/* Title */}
    <FadeSlideIn delay={0.4} className="mb-6">
      <Title as="h2" className="mb-2">
        Session Complete
      </Title>
      <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
        {sessionName}
      </Text>
    </FadeSlideIn>

    {/* Stats */}
    <FadeSlideIn delay={0.6} className="mb-8 flex gap-8">
      <div>
        <Text as="p" styleProps={{ size: '2xl', weight: 'bold' }}>
          {String(exercisesCompleted)}
        </Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Exercises
        </Text>
      </div>
      {estimatedDurationMinutes && (
        <div>
          <Text as="p" styleProps={{ size: '2xl', weight: 'bold' }}>
            {String(estimatedDurationMinutes)}
          </Text>
          <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            Minutes
          </Text>
        </div>
      )}
    </FadeSlideIn>

    {/* Back to Programme button */}
    <FadeSlideIn delay={0.8}>
      <Button variant="primary" size="lg" onClick={onBackToProgramme}>
        Back to Programme
      </Button>
    </FadeSlideIn>
  </div>
);
