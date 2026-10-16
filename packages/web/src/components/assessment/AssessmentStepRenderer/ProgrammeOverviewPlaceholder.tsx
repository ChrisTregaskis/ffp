import { Text } from '@web/components/atoms';

/** Placeholder for the programme overview step, shown until the step has content. */
export const ProgrammeOverviewPlaceholder: React.FC = () => (
  <div className="mx-auto max-w-3xl py-16 text-center">
    <Text as="h2" styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}>
      Programme Overview
    </Text>
    <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-2">
      Your programme details will appear here soon.
    </Text>
  </div>
);
