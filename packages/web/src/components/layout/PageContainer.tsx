import type { PropsWithChildren } from 'react';

/**
 * Standard page content container.
 * Provides consistent max-width, horizontal centering, and padding.
 */
export const PageContainer: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="container mx-auto p-6">{children}</div>;
};
