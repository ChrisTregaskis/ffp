import type { ReactNode } from 'react';

interface ComponentPageWrapperProps {
  children: ReactNode;
  maxWidth?: '4xl' | '6xl' | '7xl';
}

/**
 * Page wrapper for component showcase pages (development only).
 *
 * Provides consistent page layout with:
 * - Full-height background
 * - Centered content container
 * - Configurable max-width
 *
 * @example
 * ```tsx
 * <ComponentPageWrapper maxWidth="6xl">
 *   <ComponentPageHeader title="Icon Components" />
 *   {/* Page content *\/}
 * </ComponentPageWrapper>
 * ```
 */
export function ComponentPageWrapper({
  children,
  maxWidth = '6xl',
}: ComponentPageWrapperProps): JSX.Element {
  const maxWidthClass = {
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className={`mx-auto ${maxWidthClass}`}>{children}</div>
    </div>
  );
}
