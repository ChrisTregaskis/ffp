import type { FlowStepConfig } from '@ffp/core';

import { Button } from '@web/components/button';
import { Icon, IconBadge, Icons } from '@web/components/Icon';

export interface TransitionScreenProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Callback when user clicks "Continue" */
  onContinue: () => void;
  /** Callback when user clicks "Back" */
  onBack: () => void;
}

/**
 * Assessment transition screen.
 *
 * Displayed between assessment phases (e.g., questionnaire to physical assessment).
 * Shows what to expect next, safety notes from the flow configuration,
 * and navigation buttons to proceed or go back.
 */
export const TransitionScreen: React.FC<TransitionScreenProps> = ({
  config,
  onContinue,
  onBack,
}) => {
  const { title, description, safetyNotes, estimatedMinutes } = config;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Heading */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ffp-navy">{title}</h1>
        {description && <p className="mt-3 text-lg text-muted-foreground">{description}</p>}
      </div>

      {/* What's Next overview */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-2">
            <Icon
              name={Icons.ACTIVITY}
              styleProps={{ size: 'md', colour: 'var(--color-primary)' }}
            />
            <h2 className="text-xl font-semibold text-ffp-navy">What&apos;s Next</h2>
          </div>
          {estimatedMinutes && (
            <p className="mt-1 text-sm text-muted-foreground">
              This section will take approximately {estimatedMinutes} minutes to complete
            </p>
          )}
        </div>

        {/* Feature columns */}
        <div className="grid grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.VIDEO} size="lg" variant="secondary" />
            <h3 className="mt-3 font-semibold text-ffp-navy">Video-Guided</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow along with clear video demonstrations for each exercise
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.TARGET} size="lg" variant="secondary" />
            <h3 className="mt-3 font-semibold text-ffp-navy">Strength &amp; Balance</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Simple tests to measure your current physical abilities
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <IconBadge name={Icons.CLOCK} size="lg" variant="secondary" />
            <h3 className="mt-3 font-semibold text-ffp-navy">At Your Own Pace</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Take breaks whenever you need — your progress is saved automatically
            </p>
          </div>
        </div>
      </section>

      {/* Safety Notes */}
      {safetyNotes && safetyNotes.length > 0 && (
        <section className="rounded-2xl border border-warning/30 bg-warning/5 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <IconBadge name={Icons.ALERTTRIANGLE} size="md" variant="warning" />
            <h2 className="text-xl font-semibold text-ffp-navy">Safety Notes</h2>
          </div>
          <ul className="space-y-3">
            {safetyNotes.map((note) => (
              <li key={note} className="flex items-start gap-3">
                <Icon
                  name={Icons.SHIELD}
                  styleProps={{ size: 'md', colour: 'var(--color-warning)' }}
                />
                <span className="text-sm">{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="lg" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};
