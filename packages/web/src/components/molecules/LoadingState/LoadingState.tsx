import React from 'react';

import { LoadingSpinner, Text } from '@web/components/atoms';
import type { SpinnerVariant, TextSize } from '@web/components/atoms';

/**
 * `page` a page's content area · `screen` the full viewport · `area` a block inside a page or card
 * · `fill` whatever its parent's box is (a video frame, an overlay).
 */
export type LoadingStateLayout = 'page' | 'screen' | 'area' | 'fill';

interface LayoutStyle {
  wrapper: string;
  spinner: SpinnerVariant;
  message: TextSize;
}

const LAYOUT_STYLES: Record<LoadingStateLayout, LayoutStyle> = {
  page: {
    wrapper: 'flex min-h-[60vh] flex-col items-center justify-center gap-4',
    spinner: 'inline',
    message: 'base',
  },
  screen: {
    wrapper: 'flex min-h-screen flex-col items-center justify-center gap-3',
    spinner: 'center',
    message: 'sm',
  },
  area: {
    wrapper: 'flex flex-col items-center justify-center gap-3 py-16',
    spinner: 'center',
    message: 'sm',
  },
  fill: {
    wrapper: 'flex h-full w-full flex-col items-center justify-center gap-3',
    spinner: 'inline',
    message: 'sm',
  },
};

export interface LoadingStateProps {
  /** Shown beneath the spinner */
  message?: string;
  /** @default 'area' */
  layout?: LoadingStateLayout;
  /** Extra wrapper classes, e.g. a pulse */
  className?: string;
}

/** A spinner with an optional message, sized to the space it is waiting to fill. */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  layout = 'area',
  className = '',
}) => {
  const style = LAYOUT_STYLES[layout];

  return (
    <div className={`${style.wrapper} ${className}`.trim()}>
      <LoadingSpinner size="lg" variant={style.spinner} />
      {message && (
        <Text as="p" styleProps={{ size: style.message, colour: 'muted-foreground' }}>
          {message}
        </Text>
      )}
    </div>
  );
};
