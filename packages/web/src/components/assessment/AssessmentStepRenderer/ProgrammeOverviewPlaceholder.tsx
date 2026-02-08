import { Text } from '@web/components/text';

/** Placeholder for the programme overview step (deferred to FFP-3). */
export const ProgrammeOverviewPlaceholder: React.FC = () => (
  <div className="mx-auto max-w-3xl py-16 text-center">
    <Text as="h2" styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}>
      Programme Overview
    </Text>
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-2">
      Programme details will be available when FFP-3 is complete.
    </Text>
  </div>
);
