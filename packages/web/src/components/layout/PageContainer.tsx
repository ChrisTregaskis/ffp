import React from 'react';

import type { PropsWithChildren } from 'react';

interface PageContainerProps extends PropsWithChildren {
  /** Centre content with a max-width constraint (e.g. programme user pages). */
  centred?: boolean;
}

/**
 * Standard page content container.
 * Provides consistent padding. Use `centred` for programme user pages
 * where content should be horizontally centred rather than left-aligned.
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children, centred = false }) => {
  return <div className={`p-6 ${centred ? 'mx-auto max-w-5xl' : ''}`}>{children}</div>;
};
