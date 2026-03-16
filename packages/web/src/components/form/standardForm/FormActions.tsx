import React from 'react';

import { Button } from '@web/components/button';

export interface FormActionsProps {
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Submit button label @default "Save Changes" */
  submitLabel?: string;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Whether the cancel button is disabled @default false */
  cancelDisabled?: boolean;
  /** Whether the submit button is disabled @default false */
  submitDisabled?: boolean;
}

/** Reusable form action bar with cancel and submit buttons, separated by a top border. */
export const FormActions: React.FC<FormActionsProps> = ({
  onCancel,
  submitLabel = 'Save Changes',
  isSubmitting = false,
  cancelDisabled = false,
  submitDisabled = false,
}) => (
  <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
    <Button variant="secondary" onClick={onCancel} disabled={cancelDisabled || isSubmitting}>
      Cancel
    </Button>
    <Button type="submit" disabled={submitDisabled} loading={isSubmitting}>
      {submitLabel}
    </Button>
  </div>
);
