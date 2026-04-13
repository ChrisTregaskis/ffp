import React from 'react';

import type { PropsWithChildren } from 'react';

type MaxWidth = 'narrow' | 'medium' | 'wide';

const MAX_WIDTH_CLASSES: Record<MaxWidth, string> = {
  narrow: 'max-w-3xl',
  medium: 'max-w-4xl',
  wide: 'max-w-5xl',
};

interface PageContainerProps extends PropsWithChildren {
  /** Centre content with a max-width constraint (e.g. programme user pages). */
  centred?: boolean;
  /** Max-width when centred. @default 'wide' */
  maxWidth?: MaxWidth;
}

/**
 * Standard page content container.
 *
 * Admin pages use default padding (`p-6`).
 * Programme user pages use `centred` with a `maxWidth` for consistent
 * centred layout with responsive horizontal padding.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  centred = false,
  maxWidth = 'wide',
}) => {
  if (centred) {
    return (
      <div className={`mx-auto ${MAX_WIDTH_CLASSES[maxWidth]} px-4 py-8 sm:px-6`}>{children}</div>
    );
  }

  return <div className="p-6">{children}</div>;
};
