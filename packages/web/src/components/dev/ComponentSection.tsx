import { Title } from '@web/components/text';

import type { ReactNode } from 'react';

interface ComponentSectionProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  /** Optional ID for anchor linking */
  id?: string;
}

/**
 * Section wrapper for component showcase pages (development only).
 */
export const ComponentSection: React.FC<ComponentSectionProps> = ({
  title,
  children,
  className = '',
  id,
}) => {
  return (
    <section id={id} className={`mb-8 rounded-lg bg-card p-6 shadow ${className}`.trim()}>
      <Title as="h2" className="mb-4" colour="card-foreground">
        {title}
      </Title>
      {children}
    </section>
  );
};
