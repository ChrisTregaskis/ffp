import { Text } from '../Text';

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
  <Text as="span" styleProps={{ colour: 'destructive' }} className="ml-1">
    <span aria-hidden="true">*</span>
    <span className="sr-only"> (required)</span>
  </Text>
);
