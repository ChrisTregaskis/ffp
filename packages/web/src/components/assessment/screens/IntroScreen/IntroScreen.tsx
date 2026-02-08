import type { FlowStepConfig } from '@ffp/core';

import type { FeatureItem } from '@web/components/assessment';
import {
  FeatureColumnGrid,
  InstructionList,
  SectionHeader,
  SectionPanel,
} from '@web/components/assessment';
import { Button } from '@web/components/button';
import { Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface IntroScreenProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Callback when user clicks "Start Assessment" */
  onStart: () => void;
}

const INTRO_FEATURES: FeatureItem[] = [
  {
    icon: Icons.CLIPBOARDLIST,
    heading: 'Pre-Assessment Questions',
    description: 'Quick questions about your goals and pain levels',
  },
  {
    icon: Icons.VIDEO,
    heading: 'Video-Guided Tests',
    description: 'Strength and balance assessments with clear video instructions',
  },
  {
    icon: Icons.CHECKCIRCLE,
    heading: 'Personalised Programme',
    description: 'Custom physiotherapy programme based on your assessment results',
  },
];

/**
 * Assessment intro screen.
 *
 * Welcome screen displayed at the start of an assessment flow.
 * Shows what to expect, estimated duration, a preparation checklist,
 * and a button to begin.
 */
export const IntroScreen: React.FC<IntroScreenProps> = ({ config, onStart }) => {
  const { title, description, instructions, estimatedMinutes } = config;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Welcome heading */}
      <div className="text-center">
        <Text
          as="h1"
          styleProps={{ size: '3xl', weight: 'bold', colour: 'ffp-navy' }}
          className="tracking-tight"
        >
          {title}
        </Text>
        {description && (
          <Text as="p" styleProps={{ size: 'lg', colour: 'muted-foreground' }} className="mt-3">
            {description}
          </Text>
        )}
      </div>

      {/* What to Expect */}
      <SectionPanel>
        <div className="px-6 pt-6 pb-5">
          <SectionHeader
            icon={Icons.CLOCK}
            title="What to Expect"
            description={
              estimatedMinutes
                ? `This assessment will take approximately ${String(estimatedMinutes)} minutes to complete`
                : undefined
            }
            as="h2"
            align="centre"
          />
        </div>

        <FeatureColumnGrid features={INTRO_FEATURES} headingLevel="h3" className="px-6 py-8" />
      </SectionPanel>

      {/* Before You Begin checklist */}
      {instructions && instructions.length > 0 && (
        <SectionPanel variant="gradient" className="p-6">
          <InstructionList
            items={instructions}
            title="Before You Begin:"
            titleAs="h2"
            bulletStyle="icon"
            bulletIcon={Icons.CHECKCIRCLE}
            bulletColour="var(--color-success)"
          />
        </SectionPanel>
      )}

      {/* Start button and footer */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Button variant="primary" size="lg" onClick={onStart}>
          Start Assessment
        </Button>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Your progress will be saved automatically. You can return to complete the assessment later
          if needed.
        </Text>
      </div>
    </div>
  );
};
