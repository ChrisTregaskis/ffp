import { Text } from '@web/components/text';

/**
 * Required field indicator (red asterisk).
 *
 * A reusable component for indicating required form fields.
 * Includes screen reader text for accessibility.
 *
 * @example
 * ```tsx
 * <label>
 *   Email address <RequiredIndicator />
 * </label>
 * ```
 */
export const RequiredIndicator: React.FC = () => (
  <Text as="span" styleProps={{ colour: 'destructive' }} className="ml-1" aria-hidden="true">
    *<span className="sr-only"> (required)</span>
  </Text>
);
