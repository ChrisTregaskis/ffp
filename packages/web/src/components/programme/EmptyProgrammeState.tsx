import { Icons } from '@web/components/atoms';
import { Card, StatusResult } from '@web/components/molecules';

/**
 * Empty state when the user has no active programme.
 */
export const EmptyProgrammeState: React.FC = () => (
  <Card className="py-12">
    <StatusResult
      icon={Icons.CLIPBOARDLIST}
      iconVariant="primary"
      title="No active programme"
      titleAs="h3"
      description="Your personalised programme will appear here once your assessment has been completed and reviewed."
      spacing="feature"
    />
  </Card>
);
