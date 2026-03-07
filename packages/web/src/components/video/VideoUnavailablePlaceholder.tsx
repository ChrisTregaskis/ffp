import React from 'react';

import { IconBadge, Icons } from '../Icon';
import { Text } from '../text';

/** Placeholder shown when no video source is available. */
export const VideoUnavailablePlaceholder: React.FC = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
    <IconBadge name={Icons.PLAY} size="lg" variant="secondary" />
    <Text as="p" styleProps={{ size: 'lg', weight: 'semibold', colour: 'foreground' }}>
      Video Unavailable
    </Text>
    <Text
      as="p"
      styleProps={{ size: 'sm', colour: 'muted-foreground' }}
      className="max-w-xs text-center"
    >
      This exercise does not have a video attached yet.
    </Text>
  </div>
);
