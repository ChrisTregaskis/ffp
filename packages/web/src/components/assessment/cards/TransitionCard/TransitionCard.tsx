import type { FlowStepConfig } from '@ffp/core';

import { AssessmentNavigation } from '@web/components/assessment';
import { Icon, IconBadge, Icons } from '@web/components/Icon';
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
            <div className="flex gap-2 items-center justify-center">
              <Icon
                name={Icons.ACTIVITY}
                styleProps={{ size: 'md', colour: 'var(--color-primary)' }}
              />
              <Text as="h3" styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}>
                What&apos;s Next
              </Text>
            </div>
            {estimatedMinutes && (
              <Text
                as="p"
                styleProps={{ size: 'sm', colour: 'muted-foreground' }}
                className="mt-1 text-center"
              >
                This section will take approximately {estimatedMinutes} minutes to complete
              </Text>
            )}
          </div>
        )}

        {/* Feature columns */}
        <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.VIDEO} size="lg" variant="secondary" />
            <Text as="h4" styleProps={{ weight: 'semibold', colour: 'ffp-navy' }} className="mt-3">
              Video-Guided
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              Follow along with clear video demonstrations for each exercise
            </Text>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.TARGET} size="lg" variant="secondary" />
            <Text as="h4" styleProps={{ weight: 'semibold', colour: 'ffp-navy' }} className="mt-3">
              Strength &amp; Balance
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              Simple tests to measure your current physical abilities
            </Text>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.CLOCK} size="lg" variant="secondary" />
            <Text as="h4" styleProps={{ weight: 'semibold', colour: 'ffp-navy' }} className="mt-3">
              At Your Own Pace
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              Take breaks whenever you need — your progress is saved automatically
            </Text>
          </div>
        </div>
      </section>

      {/* Safety Notes */}
      {safetyNotes && safetyNotes.length > 0 && (
        <section className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <IconBadge name={Icons.ALERTTRIANGLE} size="md" variant="warning" />
            <Text as="h3" styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}>
              Safety Notes
            </Text>
          </div>
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
  );
};
