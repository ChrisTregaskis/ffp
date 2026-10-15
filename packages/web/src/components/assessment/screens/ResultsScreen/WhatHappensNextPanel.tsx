import { Icons, Surface, Text } from '@web/components/atoms';

import { FeatureColumnGrid, type FeatureItem } from '../../FeatureColumnGrid';

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
    <Surface as="section" variant="tinted" padding="lg">
      <Text as="h2" styleProps={{ size: 'xl', weight: 'bold', colour: 'ffp-navy' }}>
        What Happens Next?
      </Text>
      <FeatureColumnGrid features={NEXT_STEPS} className="mt-6" />
    </Surface>
  );
};
