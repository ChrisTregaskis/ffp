import { Button } from '@web/components/atoms';
import { Modal } from '@web/components/organisms';

export interface ExitDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Number of exercises completed so far */
  completedCount: number;
  /** Total number of exercises in the session */
  totalCount: number;
  /** Called when "Pause — I'll finish later" is clicked */
  onPause: () => void;
  /** Called when "I'm done with this session" is clicked */
  onDone: () => void;
  /** Called on Cancel, the close button, Escape or a backdrop click */
  onCancel: () => void;
}

/**
 * Two-intent exit dialog for leaving a session.
 *
 * Offers "Pause — I'll finish later" (session stays in_progress)
 * and "I'm done with this session" (marks session completed).
 */
export const ExitDialog: React.FC<ExitDialogProps> = ({
  isOpen,
  completedCount,
  totalCount,
  onPause,
  onDone,
  onCancel,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title="Leaving session?"
    subtitle={`You've completed ${String(completedCount)} of ${String(totalCount)} exercises.`}
    size="sm"
    hideDividers
  >
    <div className="space-y-3">
      <Button variant="secondary" size="md" fullWidth onClick={onPause}>
        Pause — I&apos;ll finish later
      </Button>
      <Button variant="neutral" size="md" fullWidth onClick={onDone}>
        I&apos;m done with this session
      </Button>
      <Button variant="ghost" size="sm" fullWidth onClick={onCancel}>
        Cancel
      </Button>
    </div>
  </Modal>
);
