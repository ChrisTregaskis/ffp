import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

import type { ReactNode } from 'react';

export interface CardProps {
  /** Card content */
  children: ReactNode;
  /** Optional card title (rendered as h2) */
  title?: string;
  /** Optional card subtitle/description */
  subtitle?: string;
  /** Center align header content @default false */
  centerHeader?: boolean;
  /** Additional custom classes for card container */
  className?: string;
  /** Additional custom classes for content area */
  contentClassName?: string;
}

/**
 * Card component for displaying content in a contained, elevated surface.
 */
export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  centerHeader = false,
  className = '',
  contentClassName = '',
}) => {
  const hasHeader = title ?? subtitle;
  const headerAlignment = centerHeader ? 'text-center' : '';

  return (
    <div className={`bg-white rounded-lg shadow-xl border border-border p-8 ${className}`.trim()}>
      {hasHeader && (
        <div className={`mb-6 ${headerAlignment}`.trim()}>
          {title && (
            <Title as="h2" className="mb-2">
              {title}
            </Title>
          )}
          {subtitle && (
            <Text as="p" styleProps={{ colour: 'muted-foreground' }}>
              {subtitle}
            </Text>
          )}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </div>
  );
};
