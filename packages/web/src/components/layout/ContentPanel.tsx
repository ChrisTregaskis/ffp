import React from 'react';

import type { PropsWithChildren } from 'react';

/**
 * Responsive content panel for form-based or narrow-content pages.
 *
 * Full width on small screens, constrained on larger viewports.
 * Use inside PageContainer for consistent page structure.
 */
export const ContentPanel: React.FC<PropsWithChildren> = ({ children }) => {
  return <div className="w-full lg:w-2/3 xl:w-1/2">{children}</div>;
};
