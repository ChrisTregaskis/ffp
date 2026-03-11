import React from 'react';

import { Text } from '@web/components/text';

interface VideoTitleCellProps {
  title: string;
  description: string | null;
}

/**
 * Two-line cell for the video library table.
 * Displays the video title (bold) with a truncated description preview below.
 */
export const VideoTitleCell: React.FC<VideoTitleCellProps> = ({ title, description }) => (
  <div className="min-w-0 max-w-[280px] py-0.5">
    <Text
      as="span"
      styleProps={{ size: 'sm', weight: 'semibold', colour: 'foreground' }}
      className="truncate block"
    >
      {title}
    </Text>
    {description ? (
      <Text
        as="p"
        styleProps={{ size: 'xs', colour: 'muted-foreground' }}
        className="mt-0.5 truncate"
      >
        {description}
      </Text>
    ) : null}
  </div>
);
