import { ClickScale } from '@web/components/motion';
import { StepIndicator } from '@web/components/programme/StepIndicator';
import { Text } from '@web/components/text/Text';

export interface ExerciseSidebarItemProps {
  /** Exercise title */
  title: string;
  /** 1-based exercise index */
  index: number;
  /** Whether this is the currently active exercise */
  isCurrent: boolean;
  /** Whether this exercise is completed */
  isCompleted: boolean;
  /** Called when the item is clicked */
  onClick: () => void;
}

/** Derive StepIndicator status from sidebar item state */
const getStepStatus = (
  isCurrent: boolean,
  isCompleted: boolean
): 'completed' | 'current' | 'upcoming' => {
  if (isCompleted) {
    return 'completed';
  }

  if (isCurrent) {
    return 'current';
  }

  return 'upcoming';
};

/**
 * Sidebar navigation item for a session exercise.
 *
 * Uses StepIndicator (dark context) for status and dark-blue background for active exercise.
 */
export const ExerciseSidebarItem: React.FC<ExerciseSidebarItemProps> = ({
  title,
  index,
  isCurrent,
  isCompleted,
  onClick,
}) => {
  const bgClass = isCurrent ? 'bg-ffp-dark-blue text-white' : 'hover:bg-muted/50';
  const opacityClass = isCompleted && !isCurrent ? 'opacity-60' : '';

  return (
    <ClickScale scale={0.97} duration={0.1}>
      <button
        onClick={onClick}
        className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 ${bgClass} ${opacityClass}`}
        aria-current={isCurrent ? 'step' : undefined}
      >
        <StepIndicator
          stepNumber={index}
          status={getStepStatus(isCurrent, isCompleted)}
          size="sm"
          context={isCurrent ? 'dark' : 'light'}
        />

        <Text
          styleProps={{
            size: 'sm',
            weight: isCurrent ? 'medium' : 'normal',
            colour: isCurrent ? 'white' : isCompleted ? 'muted-foreground' : 'foreground',
          }}
          className={isCompleted && !isCurrent ? 'line-through' : ''}
        >
          {title}
        </Text>
      </button>
    </ClickScale>
  );
};
