import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { LEVEL_META, type Level } from './prototype-level-model';
import {
  FOCUS_AREAS,
  GOALS,
  LEVELS,
  type FocusId,
  type GoalId,
  type Scenario,
} from './prototype-programmes';

interface ScenarioSelectorProps {
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}

const MAX_FOCUS = 2;

/** Picks the assessment result (level + goal + focus) both models are compared against. */
export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenario, onChange }) => {
  const levelOptions = LEVELS.map((level) => ({ value: level, label: LEVEL_META[level].name }));
  const goalOptions = GOALS.map((goal) => ({ value: goal.id, label: goal.label }));

  const toggleFocus = (id: FocusId): void => {
    const selected = scenario.focusIds.includes(id);

    if (selected) {
      onChange({ ...scenario, focusIds: scenario.focusIds.filter((focus) => focus !== id) });

      return;
    }

    // Keep at most two; drop the oldest when a third is added.
    const next = [...scenario.focusIds, id].slice(-MAX_FOCUS);
    onChange({ ...scenario, focusIds: next });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>The assessment result</Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
        Level comes from scoring; goal and focus come from the member’s answers.
      </Text>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
            Level
          </Text>
          <Select
            value={scenario.level}
            onChange={(value) => {
              onChange({ ...scenario, level: Number(value) as Level });
            }}
            options={levelOptions}
            ariaLabel="Level"
          />
        </div>
        <div className="space-y-1">
          <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
            Goal
          </Text>
          <Select
            value={scenario.goalId}
            onChange={(value) => {
              onChange({ ...scenario, goalId: value as GoalId });
            }}
            options={goalOptions}
            ariaLabel="Goal"
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
          Focus areas (up to {MAX_FOCUS})
        </Text>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_AREAS.map((focus) => {
            const selected = scenario.focusIds.includes(focus.id);

            return (
              <button
                key={focus.id}
                type="button"
                onClick={() => {
                  toggleFocus(focus.id);
                }}
                className={`rounded-full border px-3 py-1 ${
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Text styleProps={{ size: 'sm', colour: selected ? 'primary' : 'foreground' }}>
                  {focus.label}
                </Text>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
