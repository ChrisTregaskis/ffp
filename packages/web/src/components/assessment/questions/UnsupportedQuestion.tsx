import { Text } from '@web/components/atoms';

/** Fallback component for unsupported question types. */
export const UnsupportedQuestion: React.FC<{ questionType: string }> = ({ questionType }) => (
  <div
    role="alert"
    className="rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-center"
  >
    <Text styleProps={{ colour: 'muted-foreground' }}>
      Unsupported question type: <code className="rounded bg-background px-1">{questionType}</code>
    </Text>
  </div>
);
