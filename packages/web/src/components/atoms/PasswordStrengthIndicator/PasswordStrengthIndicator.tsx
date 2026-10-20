import { PasswordStrength } from '@web/utils/passwordStrength';

import { Text, type TextColour } from '../Text';

export interface PasswordStrengthIndicatorProps {
  /** Current password strength (null if not yet determined) */
  strength: PasswordStrength | null;
}

/**
 * Password strength indicator component.
 *
 * Displays password strength (Weak, Medium, Strong) in the top-right corner of the input field.
 * Only shown after all password requirements are met.
 */
export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  strength,
}) => {
  if (!strength) {
    return null;
  }

  const getStrengthConfig = (
    strengthLevel: PasswordStrength
  ): { label: string; colour: TextColour } => {
    switch (strengthLevel) {
      case PasswordStrength.WEAK:
        return {
          label: 'Weak',
          colour: 'destructive',
        };
      case PasswordStrength.MEDIUM:
        return {
          label: 'Medium',
          colour: 'warning',
        };
      case PasswordStrength.STRONG:
        return {
          label: 'Strong',
          colour: 'success',
        };
    }
  };

  const config = getStrengthConfig(strength);

  return (
    <div data-testid="password-strength-indicator">
      <Text styleProps={{ size: 'sm', weight: 'semibold', colour: config.colour }}>
        {config.label}
      </Text>
    </div>
  );
};
