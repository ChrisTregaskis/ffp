import { Text } from '@web/components/text';

import { Chip } from './Chip';
import { ExampleStep } from './ExampleStep';
import { LevelModelPanel } from './LevelModelPanel';
import { StepArrow } from './StepArrow';

/** Sam's activity answers in the worked example — two lower, one higher. */
const SAM_ANSWERS = [
  { question: 'Typical weekly activity', detail: '“Low”', category: 'Lower' },
  { question: 'Exercise tolerance', detail: '“Low”', category: 'Lower' },
  { question: 'How joints & muscles feel', detail: '“Flexible”', category: 'Higher' },
];

/** A worked-example explainer for how the confirmed model turns answers into a level. */
export const ScoringHelpContent: React.FC = () => (
  <div className="space-y-6">
    <section className="space-y-2">
      <Text as="p" styleProps={{ size: 'sm' }}>
        Scoring decides which starting <strong>level</strong> a member is placed on after the flow.
        The level sets the intensity; their goal and focus areas tailor the content within it.
      </Text>
      <Text as="p" styleProps={{ size: 'sm' }}>
        A level is decided in two steps: the <strong>activity</strong> answers set a base level,
        then <strong>age</strong> can bump it up.
      </Text>
    </section>

    {/* The model at a glance — the two-step rule, the matrix, and the level programmes. */}
    <LevelModelPanel />

    <section className="space-y-3">
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>
        A worked example — Sam, aged 46–55
      </Text>

      <ExampleStep step={1} title="The member answers the three activity questions">
        <div className="space-y-2 rounded-md border border-border bg-background p-3">
          {SAM_ANSWERS.map((answer) => (
            <div key={answer.question} className="flex items-center justify-between gap-2">
              <Text styleProps={{ size: 'sm' }}>
                {answer.question}{' '}
                <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                  · {answer.detail}
                </Text>
              </Text>
              <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5">
                <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'primary' }}>
                  {answer.category}
                </Text>
              </span>
            </div>
          ))}
        </div>
      </ExampleStep>

      <StepArrow />

      <ExampleStep step={2} title="The answers are tallied for a base level">
        <div className="rounded-md border border-border bg-background p-3">
          <Text as="p" styleProps={{ size: 'sm' }}>
            Lower ×2, Higher ×1 → mostly lower →{' '}
            <Text styleProps={{ size: 'sm', weight: 'semibold' }}>base Level 1</Text>
          </Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            A clear majority sets the level. No majority (one of each) falls to Level 2.
          </Text>
        </div>
      </ExampleStep>

      <StepArrow />

      <ExampleStep step={3} title="Age can bump the level up">
        <div className="space-y-1.5 rounded-md border border-border bg-background p-3">
          <Text as="p" styleProps={{ size: 'sm' }}>
            Under 40 → one level higher (capped at Level 3). 40+ → no change. Sam is{' '}
            <Chip>46–55</Chip>, so there’s no bump.
          </Text>
          <Text as="p" styleProps={{ size: 'sm' }}>
            Result:{' '}
            <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'success' }}>
              Level 1 — Gentle / Mobility
            </Text>
          </Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            Were Sam under 40, the same answers would lift to Level 2.
          </Text>
        </div>
      </ExampleStep>
    </section>

    <section className="space-y-2 rounded-md border border-info bg-info p-3">
      <Text as="p" styleProps={{ size: 'sm', weight: 'semibold', colour: 'white' }}>
        Why a tally, not a total
      </Text>
      <Text as="p" styleProps={{ size: 'sm', colour: 'white' }}>
        The level follows the <strong>majority</strong> of the activity answers, so a single outlier
        answer doesn’t drag someone across a boundary. Age is the one input that can shift the level
        on its own.
      </Text>
    </section>
  </div>
);
