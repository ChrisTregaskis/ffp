import type { FlowStepConfig } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon, IconBadge, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

export interface IntroScreenProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Callback when user clicks "Start Assessment" */
  onStart: () => void;
}

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
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Header with duration */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-2">
            <Icon name={Icons.CLOCK} styleProps={{ size: 'md', colour: 'var(--color-primary)' }} />
            <Text as="h2" styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}>
              What to Expect
            </Text>
          </div>
          {estimatedMinutes && (
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              This assessment will take approximately {estimatedMinutes} minutes to complete
            </Text>
          )}
        </div>

        {/* Feature columns */}
        <div className="grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.CLIPBOARDLIST} size="lg" variant="secondary" />
            <Text as="h3" styleProps={{ weight: 'semibold', colour: 'ffp-navy' }} className="mt-3">
              Pre-Assessment Questions
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              Quick questions about your goals and pain levels
            </Text>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.VIDEO} size="lg" variant="secondary" />
            <Text as="h3" styleProps={{ weight: 'semibold', colour: 'ffp-navy' }} className="mt-3">
              Video-Guided Tests
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              Strength and balance assessments with clear video instructions
            </Text>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.CHECKCIRCLE} size="lg" variant="secondary" />
            <Text as="h3" styleProps={{ weight: 'semibold', colour: 'ffp-navy' }} className="mt-3">
              Personalised Programme
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mt-1">
              Custom physiotherapy programme based on your assessment results
            </Text>
          </div>
        </div>
      </section>

      {/* Before You Begin checklist */}
      {instructions && instructions.length > 0 && (
        <section className="rounded-2xl bg-linear-to-br from-secondary/40 to-primary/10 p-6 shadow-xl">
          <Text
            as="h2"
            styleProps={{ size: 'xl', weight: 'semibold', colour: 'ffp-navy' }}
            className="mb-4"
          >
            Before You Begin:
          </Text>
          <ul className="space-y-3">
            {instructions.map((instruction) => (
              <li key={instruction} className="flex items-start gap-3">
                <Icon
                  name={Icons.CHECKCIRCLE}
                  styleProps={{ size: 'md', colour: 'var(--color-success)' }}
                />
                <Text as="span" styleProps={{ size: 'sm' }}>
                  {instruction}
                </Text>
              </li>
            ))}
          </ul>
        </section>
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
