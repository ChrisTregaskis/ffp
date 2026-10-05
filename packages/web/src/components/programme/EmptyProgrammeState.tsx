import { Icon, Icons, Text, Title } from '@web/components/atoms';
import { Card } from '@web/components/Card/Card';

/**
 * Empty state when the user has no active programme.
 */
export const EmptyProgrammeState: React.FC = () => (
  <Card className="py-12 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
      <Icon
        name={Icons.CLIPBOARDLIST}
        styleProps={{ size: 'xl', colour: 'var(--color-primary)' }}
      />
    </div>
    <Title as="h3" className="mb-2">
      No active programme
    </Title>
    <Text as="p" styleProps={{ colour: 'muted-foreground' }} className="mx-auto max-w-sm">
      Your personalised programme will appear here once your assessment has been completed and
      reviewed.
    </Text>
  </Card>
);
