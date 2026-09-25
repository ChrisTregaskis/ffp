import { FeatureColumnGrid, SectionPanel } from '@web/components/assessment';
import type { FeatureItem } from '@web/components/assessment';
import { Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

const NEXT_STEPS: FeatureItem[] = [
  {
    icon: Icons.CLIPBOARDLIST,
    heading: 'Programme Overview',
    description: 'Review your personalised exercise programme and features',
  },
  {
    icon: Icons.PLAY,
    heading: 'Start Training',
    description: 'Begin your guided exercises with video instructions',
  },
  {
    icon: Icons.CALENDAR,
    heading: 'Track Progress',
    description: 'Monitor your improvement with regular assessments',
  },
];

export const WhatHappensNextPanel: React.FC = () => {
  return (
    <SectionPanel variant="tinted" className="p-6">
      <Text as="h2" styleProps={{ size: 'xl', weight: 'bold', colour: 'ffp-navy' }}>
        What Happens Next?
      </Text>
      <FeatureColumnGrid features={NEXT_STEPS} className="mt-6" />
    </SectionPanel>
  );
};
