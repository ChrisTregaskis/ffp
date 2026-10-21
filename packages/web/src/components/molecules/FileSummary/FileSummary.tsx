import React from 'react';

import { Icon, Text } from '@web/components/atoms';
import type { IconName } from '@web/components/atoms';
import { formatFileSize } from '@web/utils/format';

import type { ReactNode } from 'react';

export interface FileSummaryProps {
  file: File;
  /** Shown after the size, such as the type or the duration */
  detail?: string;
  icon?: IconName;
  /** An action beside the summary, such as a Remove button */
  action?: ReactNode;
  className?: string;
}

/**
 * A chosen file's name and size, with an optional detail and action.
 */
export const FileSummary: React.FC<FileSummaryProps> = ({
  file,
  detail,
  icon = 'FileText',
  action,
  className = '',
}) => (
  <div className={`flex items-center justify-between gap-3 ${className}`.trim()}>
    <div className="flex min-w-0 items-center gap-3">
      <Icon name={icon} styleProps={{ size: 'md', colour: 'var(--color-primary)' }} />
      <div className="min-w-0">
        <Text as="p" styleProps={{ weight: 'medium', colour: 'foreground' }} className="truncate">
          {file.name}
        </Text>
        <Text as="p" styleProps={{ colour: 'muted-foreground', size: 'sm' }}>
          {formatFileSize(file.size)}
          {detail && <> &middot; {detail}</>}
        </Text>
      </div>
    </div>
    {action}
  </div>
);
