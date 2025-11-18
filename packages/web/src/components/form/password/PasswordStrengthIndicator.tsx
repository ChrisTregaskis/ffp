import { Text } from '@web/components/text/Text';
import { PasswordStrength } from '@web/utils/passwordStrength';

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
  ): { label: string; colorClass: string } => {
    switch (strengthLevel) {
      case PasswordStrength.WEAK:
        return {
          label: 'Weak',
          colorClass: 'text-red-600',
        };
      case PasswordStrength.MEDIUM:
        return {
          label: 'Medium',
          colorClass: 'text-yellow-600',
        };
      case PasswordStrength.STRONG:
        return {
          label: 'Strong',
          colorClass: 'text-green-600',
        };
    }
  };

  const config = getStrengthConfig(strength);

  return (
    <div className="absolute right-3 top-3" data-testid="password-strength-indicator">
      <Text styleProps={{ size: 'sm', weight: 'semibold' }} className={config.colorClass}>
        {config.label}
      </Text>
    </div>
  );
};
