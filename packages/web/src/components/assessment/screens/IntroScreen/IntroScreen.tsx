import type { FlowStepConfig } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon, IconBadge, Icons } from '@web/components/Icon';

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
        <h1 className="text-3xl font-bold tracking-tight text-ffp-navy">{title}</h1>
        {description && <p className="mt-3 text-lg text-muted-foreground">{description}</p>}
      </div>

      {/* What to Expect */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* Header with duration */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-2">
            <Icon name={Icons.CLOCK} styleProps={{ size: 'md', colour: 'var(--color-primary)' }} />
            <h2 className="text-xl font-semibold text-ffp-navy">What to Expect</h2>
          </div>
          {estimatedMinutes && (
            <p className="mt-1 text-sm text-muted-foreground">
              This assessment will take approximately {estimatedMinutes} minutes to complete
            </p>
          )}
        </div>

        {/* Feature columns */}
        <div className="grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.CLIPBOARDLIST} size="lg" variant="secondary" />
            <h3 className="mt-3 font-semibold text-ffp-navy">Pre-Assessment Questions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick questions about your goals and pain levels
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.VIDEO} size="lg" variant="secondary" />
            <h3 className="mt-3 font-semibold text-ffp-navy">Video-Guided Tests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Strength and balance assessments with clear video instructions
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.CHECKCIRCLE} size="lg" variant="secondary" />
            <h3 className="mt-3 font-semibold text-ffp-navy">Personalised Programme</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Custom physiotherapy programme based on your assessment results
            </p>
          </div>
        </div>
      </section>

      {/* Before You Begin checklist */}
      {instructions && instructions.length > 0 && (
        <section className="rounded-2xl bg-gradient-to-br from-secondary/40 to-primary/10 p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-ffp-navy">Before You Begin:</h2>
          <ul className="space-y-3">
            {instructions.map((instruction) => (
              <li key={instruction} className="flex items-start gap-3">
                <Icon
                  name={Icons.CHECKCIRCLE}
                  styleProps={{ size: 'md', colour: 'var(--color-success)' }}
                />
                <span className="text-sm">{instruction}</span>
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
        <p className="text-sm text-muted-foreground">
          Your progress will be saved automatically. You can return to complete the assessment later
          if needed.
        </p>
      </div>
    </div>
  );
};
