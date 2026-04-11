import { Button } from '@web/components/button';
import { ScaleFade } from '@web/components/motion';
import { Text } from '@web/components/text/Text';
import { Title } from '@web/components/text/Title';

export interface ExitDialogProps {
  /** Number of exercises completed so far */
  completedCount: number;
  /** Total number of exercises in the session */
  totalCount: number;
  /** Called when "Pause — I'll finish later" is clicked */
  onPause: () => void;
  /** Called when "I'm done with this session" is clicked */
  onDone: () => void;
  /** Called when "Cancel" is clicked */
  onCancel: () => void;
}

/**
 * Two-intent exit dialog for leaving a session.
 *
 * Offers "Pause — I'll finish later" (session stays in_progress)
 * and "I'm done with this session" (marks session completed).
 */
export const ExitDialog: React.FC<ExitDialogProps> = ({
  completedCount,
  totalCount,
  onPause,
  onDone,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <ScaleFade className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
      <Title as="h3" className="mb-2">
        Leaving session?
      </Title>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
        You&apos;ve completed {String(completedCount)} of {String(totalCount)} exercises.
      </Text>

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
    </ScaleFade>
  </div>
);
