import React from 'react';

import { ProgressBar, Text } from '@web/components/atoms';

export interface UploadProgressProps {
  /** Upload progress, 0 to 100 */
  percent: number;
  /** A line under the bar, such as the file being sent */
  caption?: string;
  className?: string;
}

/**
 * A file upload's progress: its state, its percentage and the bar.
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({
  percent,
  caption,
  className = '',
}) => (
  <div className={className}>
    <div className="mb-2 flex items-center justify-between">
      <Text styleProps={{ weight: 'medium', size: 'sm' }}>
        {percent === 0 ? 'Preparing upload...' : 'Uploading...'}
      </Text>
      <Text styleProps={{ colour: 'muted-foreground', size: 'sm' }}>{String(percent)}%</Text>
    </div>
    <ProgressBar percent={percent} aria-label="Upload progress" />
    {caption && (
      <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }} className="mt-3">
        {caption}
      </Text>
    )}
  </div>
);
