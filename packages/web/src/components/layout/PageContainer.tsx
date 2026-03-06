import type { PropsWithChildren } from 'react';

/**
 * Standard page content container.
 * Provides consistent padding with left-aligned content.
 */
export const PageContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="p-6">{children}</div>;
};
