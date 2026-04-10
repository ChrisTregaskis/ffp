import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text/Text';

type StepIndicatorStatus = 'completed' | 'current' | 'upcoming';
type StepIndicatorSize = 'sm' | 'md';
type StepIndicatorContext = 'light' | 'dark';

export interface StepIndicatorProps {
  /** Step number (1-based) */
  stepNumber: number;
  /** Visual status */
  status: StepIndicatorStatus;
  /** Size variant — sm for sidebar items, md for dashboard dots */
  size?: StepIndicatorSize;
  /** Background context — light (page background) or dark (dark-blue sidebar) */
  context?: StepIndicatorContext;
}

const SIZE_CLASSES: Record<StepIndicatorSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
};

const TEXT_SIZE: Record<StepIndicatorSize, 'xs' | 'sm'> = {
  sm: 'xs',
  md: 'xs',
};

/** Completed state — same in both contexts */
const completedClasses = 'bg-ffp-green';

/** Current state styling depends on background context */
const currentClasses: Record<StepIndicatorContext, string> = {
  light: 'bg-ffp-dark-blue',
  dark: 'border-2 border-white/60 bg-white/20',
};

/** Upcoming state styling depends on background context */
const upcomingClasses: Record<StepIndicatorContext, string> = {
  light: 'bg-muted',
  dark: 'border-2 border-border',
};

/**
 * Step status indicator.
 *
 * Three visual states: completed (green checkmark), current (highlighted),
 * upcoming (muted with number).
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  stepNumber,
  status,
  size = 'md',
  context = 'light',
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const baseClasses = `flex items-center justify-center rounded-full ${sizeClass}`;

  const ariaLabel = `Step ${String(stepNumber)}: ${status}`;

  if (status === 'completed') {
    return (
      <div className={`${baseClasses} ${completedClasses}`} aria-label={ariaLabel}>
        <Icon name={Icons.CHECK} styleProps={{ size: 'xs', colour: '#ffffff' }} />
      </div>
    );
  }

  if (status === 'current') {
    return (
      <div className={`${baseClasses} ${currentClasses[context]}`} aria-label={ariaLabel}>
        {context === 'dark' ? (
          <div className="h-2 w-2 rounded-full bg-white" />
        ) : (
          <Text styleProps={{ size: TEXT_SIZE[size], weight: 'medium', colour: 'white' }}>
            {String(stepNumber)}
          </Text>
        )}
      </div>
    );
  }

  // Upcoming
  const textColour = context === 'dark' ? 'muted-foreground' : 'muted-foreground';

  return (
    <div className={`${baseClasses} ${upcomingClasses[context]}`} aria-label={ariaLabel}>
      <Text styleProps={{ size: TEXT_SIZE[size], colour: textColour }}>{String(stepNumber)}</Text>
    </div>
  );
};
