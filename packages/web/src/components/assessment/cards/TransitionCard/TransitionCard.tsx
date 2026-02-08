import type { FlowStepConfig } from '@ffp/core';

import type { FeatureItem } from '@web/components/assessment';
import { ASSESSMENT_MOTION, AssessmentNavigation, FeatureColumnGrid, SectionHeader } from '@web/components/assessment';
import { Icon, Icons } from '@web/components/Icon';
import { FadeSlideIn } from '@web/components/motion';
import { Text } from '@web/components/text';

import { StepCard } from '../StepCard';

import type { ReactNode } from 'react';

export interface TransitionCardProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Optional footer override (defaults to AssessmentNavigation) */
  footer?: ReactNode;
  /** Optional render of What's Next */
  showWhatsNextTitleDescription?: boolean;
}

const TRANSITION_FEATURES: FeatureItem[] = [
  {
    icon: Icons.VIDEO,
    heading: 'Video-Guided',
    description: 'Follow along with clear video demonstrations for each exercise',
  },
  {
    icon: Icons.TARGET,
    heading: 'Strength & Balance',
    description: 'Simple tests to measure your current physical abilities',
  },
  {
    icon: Icons.CLOCK,
    heading: 'At Your Own Pace',
    description: 'Take breaks whenever you need — your progress is saved automatically',
  },
];

/**
 * Assessment transition card.
 *
 * Displayed between assessment phases (e.g., questionnaire to physical
 * assessment). Shows what to expect next and safety notes from the flow
 * configuration. Navigation is handled by the footer slot.
 */
export const TransitionCard: React.FC<TransitionCardProps> = ({
  config,
  footer,
  showWhatsNextTitleDescription,
}) => {
  const { safetyNotes, estimatedMinutes } = config;

  return (
    <FadeSlideIn duration={ASSESSMENT_MOTION.duration.entrance}>
      <StepCard
        title={config.title}
        description={config.description}
        titleAlign="centre"
        footer={footer ?? <AssessmentNavigation />}
      >
        {/* What's Next overview */}
        <section className="pt-5">
          {showWhatsNextTitleDescription && (
            <div className="pb-5">
              <SectionHeader
                icon={Icons.ACTIVITY}
                title="What's Next"
                description={
                  estimatedMinutes
                    ? `This section will take approximately ${String(estimatedMinutes)} minutes to complete`
                    : undefined
                }
                align="centre"
              />
            </div>
          )}

          <FeatureColumnGrid features={TRANSITION_FEATURES} headingLevel="h4" className="py-8" />
        </section>

        {/* Safety Notes */}
        {safetyNotes && safetyNotes.length > 0 && (
          <section className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-6">
            <SectionHeader
              icon={Icons.ALERTTRIANGLE}
              title="Safety Notes"
              iconStyle="badge"
              badgeVariant="warning"
              className="mb-4"
            />
            <ul className="space-y-3">
              {safetyNotes.map((note) => (
                <li key={note} className="flex items-start gap-3">
                  <Icon
                    name={Icons.SHIELD}
                    styleProps={{ size: 'md', colour: 'var(--color-warning)' }}
                  />
                  <Text as="span" styleProps={{ size: 'sm' }}>
                    {note}
                  </Text>
                </li>
              ))}
            </ul>
          </section>
        )}
      </StepCard>
    </FadeSlideIn>
  );
};
