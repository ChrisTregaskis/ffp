import { Text } from '@web/components/text';

import { Chip } from './Chip';
import { ExampleStep } from './ExampleStep';
import { StepArrow } from './StepArrow';

/** The Activity & readiness dimension's questions and the points a sample member earns. */
const READINESS_ANSWERS = [
  {
    question: 'Typical weekly activity',
    detail: 'single choice · “Active”',
    points: '+3',
  },
  {
    question: 'Exercise tolerance',
    detail: 'single choice · “High”',
    points: '+3',
  },
  {
    question: 'How joints & muscles feel',
    detail: 'single choice · “Occasional stiffness”',
    points: '+2',
  },
];

/** A worked-example explainer for how flow scoring turns answers into a programme. */
export const ScoringHelpContent: React.FC = () => (
  <div className="space-y-6">
    <section className="space-y-2">
      <Text as="p" styleProps={{ size: 'sm' }}>
        Scoring decides which programme a member is recommended after they finish the flow. Answers
        earn points, points add up inside <strong>dimensions</strong>, and <strong>mappings</strong>{' '}
        turn those dimension scores into a programme.
      </Text>
      <Text as="p" styleProps={{ size: 'sm' }}>
        A flow can have one or more dimensions. Here a single{' '}
        <strong>Activity &amp; readiness</strong> dimension adds up three questions to place the
        member in a starting level.
      </Text>
    </section>

    <section className="space-y-3">
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>
        A worked example — the Activity &amp; readiness dimension
      </Text>

      <ExampleStep step={1} title="The member answers the dimension’s questions">
        <div className="space-y-2 rounded-md border border-border bg-background p-3">
          {READINESS_ANSWERS.map((answer) => (
            <div key={answer.question}>
              <div className="flex items-center justify-between gap-2">
                <Text styleProps={{ size: 'sm' }}>
                  {answer.question}{' '}
                  <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
                    · {answer.detail}
                  </Text>
                </Text>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 ${
                    answer.points === '+0' ? 'bg-muted' : 'bg-primary/10'
                  }`}
                >
                  <Text
                    styleProps={{
                      size: 'xs',
                      weight: 'semibold',
                      colour: answer.points === '+0' ? 'muted-foreground' : 'primary',
                    }}
                  >
                    {answer.points}
                  </Text>
                </span>
              </div>
            </div>
          ))}
        </div>
      </ExampleStep>

      <StepArrow />

      <ExampleStep step={2} title="Points add up into the dimension’s raw score">
        <div className="rounded-md border border-border bg-background p-3">
          <Text as="p" styleProps={{ size: 'sm' }}>
            3 + 3 + 2 = <Text styleProps={{ size: 'sm', weight: 'semibold' }}>8 raw points</Text>
          </Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            Each dimension only adds up its own questions — they never mix.
          </Text>
        </div>
      </ExampleStep>

      <StepArrow />

      <ExampleStep step={3} title="Read the raw score against the dimension’s settings">
        <div className="space-y-3 rounded-md border border-border bg-background p-3">
          <div>
            <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
              Maximum score
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              The most the three questions could total: 3 + 3 + 3 = <strong>9</strong>.
            </Text>
          </div>

          <div>
            <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
              Normalised score
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              Raw ÷ max, as a percentage: 8 ÷ 9 = <strong>89%</strong>.
            </Text>
          </div>

          <div>
            <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
              Lower-support &amp; moderate thresholds
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              Two cut-offs that band the <em>normalised %</em>. With moderate 45 and lower-support
              78:
            </Text>
            <div className="mt-1.5 flex overflow-hidden rounded border border-border text-center">
              <div className="flex-1 bg-warning/15 py-1">
                <Text styleProps={{ size: 'xs', colour: 'warning' }}>&lt; 45%</Text>
              </div>
              <div className="flex-1 bg-muted py-1">
                <Text styleProps={{ size: 'xs' }}>45–77%</Text>
              </div>
              <div className="flex-1 bg-success/15 py-1">
                <Text styleProps={{ size: 'xs', colour: 'success' }}>78%+</Text>
              </div>
            </div>
            <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-1">
              &lt; 45% needs the most support · 45–77% building · 78%+ strong. This member’s 89%
              sits in the top band.
            </Text>
          </div>

          <div>
            <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
              Weight (optional)
            </Text>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              A multiplier used only for the overall score, when one dimension should matter more —
              it doesn’t change this dimension’s own score.
            </Text>
          </div>
        </div>
      </ExampleStep>

      <StepArrow />

      <ExampleStep step={4} title="Mappings turn scores into a programme">
        <div className="space-y-1.5 rounded-md border border-border bg-background p-3">
          <Text as="p" styleProps={{ size: 'sm' }}>
            If <Chip>Activity &amp; readiness</Chip> is at most 4 →{' '}
            <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'success' }}>
              Level 1 — Gentle / Mobility
            </Text>
          </Text>
          <Text as="p" styleProps={{ size: 'sm' }}>
            If <Chip>Activity &amp; readiness</Chip> is at least 8 →{' '}
            <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'success' }}>
              Level 3 — Energized / Dynamic
            </Text>
          </Text>
        </div>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Mappings compare the <strong>raw</strong> score, not the %. This member’s readiness is 8,
          so the Level 3 rule matches. Rules run top to bottom and the first match wins; anything in
          between falls to Level 2.
        </Text>
      </ExampleStep>
    </section>

    <section className="space-y-2 rounded-md border border-info/20 bg-info/10 p-3">
      <Text as="p" styleProps={{ size: 'sm', weight: 'medium', colour: 'info' }}>
        Two scales to keep straight
      </Text>
      <Text as="p" styleProps={{ size: 'sm', colour: 'info' }}>
        Thresholds band the <strong>normalised %</strong>; mappings compare the <strong>raw</strong>{' '}
        points. And if no mapping matches, the member falls back to the default programme — so cover
        the ranges you care about.
      </Text>
    </section>
  </div>
);
