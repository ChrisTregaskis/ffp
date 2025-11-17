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
 *
 * Features:
 * - White background with rounded corners
 * - Shadow and border for elevation
 * - Optional header with title and subtitle
 * - Flexible content area via children
 * - Customisable alignment and styling
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card title="Welcome" subtitle="Sign in to continue">
 *   <LoginForm />
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * // Card without header
 * <Card>
 *   <p>Custom content here</p>
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * // Centered header (e.g., for auth cards)
 * <Card title="Create Account" subtitle="Join us today" centerHeader>
 *   <SignUpForm />
 * </Card>
 * ```
 */
export function Card({
  children,
  title,
  subtitle,
  centerHeader = false,
  className = '',
  contentClassName = '',
}: CardProps): JSX.Element {
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
}
