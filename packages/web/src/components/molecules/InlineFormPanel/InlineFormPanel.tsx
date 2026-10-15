import React from 'react';

import { Surface, Text } from '@web/components/atoms';

import type { PropsWithChildren } from 'react';

export interface InlineFormPanelProps {
  /** Title displayed above the form (e.g. "New Phase") */
  title: string;
}

/** Dashed-border panel for inline create/edit forms within hierarchy pages */
export const InlineFormPanel: React.FC<PropsWithChildren<InlineFormPanelProps>> = ({
  title,
  children,
}) => (
  <Surface variant="dashed" padding="md" className="mb-4">
    <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'foreground' }} className="mb-3">
      {title}
    </Text>
    {children}
  </Surface>
);
