import type { StatusCircleStatus } from '@web/components/atoms';
import { PressableArea, StatusCircle, Text } from '@web/components/atoms';
import { ClickScale } from '@web/components/motion';

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

const getStepStatus = (isCurrent: boolean, isCompleted: boolean): StatusCircleStatus => {
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
 * The active exercise sits on dark blue, so its status circle takes the inverse appearance.
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
  const status = getStepStatus(isCurrent, isCompleted);

  return (
    <ClickScale scale={0.97} duration={0.1}>
      <PressableArea
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-3 py-2.5 ${bgClass} ${opacityClass}`}
        aria-current={isCurrent ? 'step' : undefined}
      >
        <StatusCircle
          number={index}
          status={status}
          size="sm"
          appearance={isCurrent ? 'inverse' : 'filled'}
          currentMarker={isCurrent ? 'dot' : 'number'}
          aria-label={`Step ${String(index)}: ${status}`}
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
      </PressableArea>
    </ClickScale>
  );
};
