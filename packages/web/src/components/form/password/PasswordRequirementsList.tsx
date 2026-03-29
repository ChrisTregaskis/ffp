import { Text } from '@web/components/text/Text';
import type { PasswordRequirement as PasswordReq } from '@web/utils/passwordStrength';

import { PasswordRequirement } from './PasswordRequirement';

export interface PasswordRequirementsListProps {
  /** List of password requirements with their current state */
  requirements: PasswordReq[];
}

/**
 * Password requirements list component.
 *
 * Displays a "Password requirements:" heading followed by all requirements
 * with visual feedback for each one.
 * Shows success icon (green) when requirement is met, error icon (red) when not met.
 */
export const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({
  requirements,
}) => {
  return (
    <div className="space-y-3" data-testid="password-requirements-list">
      <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}>
        Password requirements:
      </Text>
      <div className="space-y-2">
        {requirements.map((requirement) => (
          <PasswordRequirement
            key={requirement.id}
            description={requirement.description}
            isMet={requirement.isMet}
          />
        ))}
      </div>
    </div>
  );
};
