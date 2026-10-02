import React from 'react';

import { Text, Title } from '@web/components/text';

import type { ReactNode } from 'react';

export interface PageHeaderProps {
  /** Page title (rendered as h1) */
  title: string;
  /** Optional subtitle text below the title */
  subtitle?: string;
  /** Optional content rendered to the right of the title (e.g., action buttons) */
  actions?: ReactNode;
}

/**
 * Reusable page header with title, optional subtitle, and optional action area.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className={`mb-6 ${actions ? 'flex items-start justify-between' : ''}`}>
      <div>
        <Title as="h1" colour="foreground" className="mb-1">
          {title}
        </Title>
        {subtitle && (
          <Text styleProps={{ size: 'base', colour: 'muted-foreground' }}>{subtitle}</Text>
        )}
      </div>
      {/* Wrapped so several buttons group on the right instead of spreading across the row */}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
};
