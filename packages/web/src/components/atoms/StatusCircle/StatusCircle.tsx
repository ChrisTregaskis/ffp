import React from 'react';

import { Icon, Icons } from '../Icon';
import { Text } from '../Text';

import type { IconSize } from '../Icon';
import type { TextSize, TextWeight } from '../Text';

export type StatusCircleStatus = 'completed' | 'current' | 'upcoming';

/** `xs` session row · `sm` sidebar step · `md` phase session dot · `lg` timeline node */
export type StatusCircleSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * `filled`: muted upcoming. `outlined`: bordered upcoming on white, for circles on a line or list.
 * `inverse`: a translucent current circle for a dark background.
 */
export type StatusCircleAppearance = 'filled' | 'outlined' | 'inverse';

export type StatusCircleCurrentMarker = 'number' | 'dot';

interface SizeStyle {
  circle: string;
  icon: IconSize;
  text: TextSize;
  currentWeight: TextWeight;
  upcomingWeight: TextWeight;
}

const SIZE_STYLES: Record<StatusCircleSize, SizeStyle> = {
  xs: {
    circle: 'h-5 w-5',
    icon: 'xs',
    text: 'xs',
    currentWeight: 'medium',
    upcomingWeight: 'normal',
  },
  sm: {
    circle: 'h-6 w-6',
    icon: 'xs',
    text: 'xs',
    currentWeight: 'medium',
    upcomingWeight: 'normal',
  },
  md: {
    circle: 'h-8 w-8',
    icon: 'xs',
    text: 'xs',
    currentWeight: 'medium',
    upcomingWeight: 'normal',
  },
  lg: {
    circle: 'h-10 w-10',
    icon: 'sm',
    text: 'sm',
    currentWeight: 'bold',
    upcomingWeight: 'medium',
  },
};

const CURRENT_CLASSES: Record<StatusCircleAppearance, string> = {
  filled: 'bg-ffp-dark-blue',
  outlined: 'bg-ffp-dark-blue',
  inverse: 'border-2 border-white/60 bg-white/20',
};

const UPCOMING_CLASSES: Record<StatusCircleAppearance, string> = {
  filled: 'bg-muted',
  outlined: 'border-2 border-border bg-white',
  inverse: 'border-2 border-border',
};

export interface StatusCircleProps {
  status: StatusCircleStatus;
  /** Shown while upcoming, and while current with the `number` marker */
  number: number;
  /** @default 'md' */
  size?: StatusCircleSize;
  /** @default 'filled' */
  appearance?: StatusCircleAppearance;
  /** What the current circle shows @default 'number' */
  currentMarker?: StatusCircleCurrentMarker;
  /** Names the circle as an image; without it the circle is read as its number */
  'aria-label'?: string;
}

/** A step's progress as a circle: a green tick when completed, highlighted when current, muted when upcoming. */
export const StatusCircle: React.FC<StatusCircleProps> = ({
  status,
  number,
  size = 'md',
  appearance = 'filled',
  currentMarker = 'number',
  'aria-label': ariaLabel,
}) => {
  const style = SIZE_STYLES[size];
  const statusClasses = {
    completed: 'bg-ffp-green',
    current: CURRENT_CLASSES[appearance],
    upcoming: UPCOMING_CLASSES[appearance],
  }[status];

  const renderContent = (): React.ReactNode => {
    if (status === 'completed') {
      return <Icon name={Icons.CHECK} styleProps={{ size: style.icon, colour: '#ffffff' }} />;
    }

    if (status === 'current' && currentMarker === 'dot') {
      return <span className="h-2 w-2 rounded-full bg-white" />;
    }

    return (
      <Text
        styleProps={
          status === 'current'
            ? { size: style.text, weight: style.currentWeight, colour: 'white' }
            : { size: style.text, weight: style.upcomingWeight, colour: 'muted-foreground' }
        }
      >
        {String(number)}
      </Text>
    );
  };

  return (
    <span
      className={`flex items-center justify-center rounded-full ${style.circle} ${statusClasses}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      {renderContent()}
    </span>
  );
};
