import React from 'react';

import { Text } from '@web/components/text';

import type { PropsWithChildren } from 'react';

interface InlineFormPanelProps {
  /** Title displayed above the form (e.g. "New Phase") */
  title: string;
}

/** Dashed-border panel for inline create/edit forms within hierarchy pages */
export const InlineFormPanel: React.FC<PropsWithChildren<InlineFormPanelProps>> = ({
  title,
  children,
}) => (
  <div className="mb-4 rounded-lg border border-dashed border-border bg-white p-4">
    <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'foreground' }} className="mb-3">
      {title}
    </Text>
    {children}
  </div>
);
