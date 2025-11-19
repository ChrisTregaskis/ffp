import type { PasswordRequirement as PasswordReq } from '@web/utils/passwordStrength';

import { PasswordRequirement } from './PasswordRequirement';

export interface PasswordRequirementsListProps {
  /** List of password requirements with their current state */
  requirements: PasswordReq[];
}

/**
 * Password requirements list component.
 *
 * Displays all password requirements with visual feedback for each one.
 * Shows success icon (green) when requirement is met, error icon (red) when not met.
 */
export const PasswordRequirementsList: React.FC<PasswordRequirementsListProps> = ({
  requirements,
}) => {
  return (
    <div className="space-y-2" data-testid="password-requirements-list">
      {requirements.map((requirement) => (
        <PasswordRequirement
          key={requirement.id}
          description={requirement.description}
          isMet={requirement.isMet}
        />
      ))}
    </div>
  );
};
