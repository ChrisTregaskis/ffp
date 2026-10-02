import { SectionPanel } from '@web/components/assessment';
import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { Text } from '@web/components/text';

export const ResultsLoadingState: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <SectionPanel>
        <div className="flex flex-col items-center gap-5 px-6 py-16">
          <div className="animate-pulse rounded-full bg-primary/10 p-5">
            <LoadingSpinner size="lg" />
          </div>
          <div className="text-center">
            <Text
              as="h1"
              styleProps={{ size: '2xl', weight: 'bold', colour: 'ffp-navy' }}
              className="tracking-tight"
            >
              Calculating Your Results...
            </Text>
            <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }} className="mt-2">
              We&apos;re analysing your responses to match against a programme.
            </Text>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
};
