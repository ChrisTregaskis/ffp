import React from 'react';

import { Button } from '@web/components/atoms';

export interface ActivationToggleButtonProps {
  /** Whether the record is in use; picks which action the button offers */
  isActive: boolean;
  /** Asks to deactivate; the caller confirms before anything is sent */
  onDeactivate: () => void;
  onActivate: () => void;
  /** Whether the activate request is in progress */
  isActivating?: boolean;
}

/** Edit-page header action that deactivates an active record or activates an inactive one. */
export const ActivationToggleButton: React.FC<ActivationToggleButtonProps> = ({
  isActive,
  onDeactivate,
  onActivate,
  isActivating = false,
}) =>
  isActive ? (
    <Button variant="destructive" onClick={onDeactivate}>
      Deactivate
    </Button>
  ) : (
    <Button variant="secondary" onClick={onActivate} loading={isActivating}>
      Activate
    </Button>
  );
