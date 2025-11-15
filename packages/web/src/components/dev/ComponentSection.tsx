import type { ReactNode } from 'react';

interface ComponentSectionProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Section wrapper for component showcase pages (development only).
 *
 * Provides consistent section styling with:
 * - White background card
 * - Shadow and rounded corners
 * - Section title
 * - Content area
 *
 * @example
 * ```tsx
 * <ComponentSection title="Size Variations">
 *   <div className="flex gap-4">
 *     {/* Section content *\/}
 *   </div>
 * </ComponentSection>
 * ```
 */
export function ComponentSection({
  title,
  children,
  className = '',
}: ComponentSectionProps): JSX.Element {
  return (
    <section className={`mb-8 rounded-lg bg-card p-6 shadow ${className}`.trim()}>
      <h2 className="mb-4 text-xl font-bold text-card-foreground">{title}</h2>
      {children}
    </section>
  );
}
