import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { CONTROL_CLASS } from './prototype-styles';

import type { QuestionOption } from './prototype-types';

interface OptionListEditorProps {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
  /** Show the per-option score field (choice questions that contribute to scoring) */
  showScores?: boolean;
}

const slugify = (label: string): string =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** Add/edit/remove the answer options for a choice question. */
export const OptionListEditor: React.FC<OptionListEditorProps> = ({
  options,
  onChange,
  showScores = true,
}) => {
  const update = (index: number, patch: Partial<QuestionOption>): void => {
    onChange(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  };

  const addOption = (): void => {
    onChange([...options, { value: '', label: '' }]);
  };

  const removeOption = (index: number): void => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Text styleProps={{ size: 'sm', weight: 'medium' }}>Answer options</Text>

      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            className={CONTROL_CLASS}
            placeholder="Label shown to the member"
            value={option.label}
            onChange={(event) => {
              const label = event.target.value;
              // Auto-fill the value from the label until it is edited directly
              const shouldSyncValue = option.value === '' || option.value === slugify(option.label);
              update(index, { label, ...(shouldSyncValue ? { value: slugify(label) } : {}) });
            }}
          />
          <input
            className={`${CONTROL_CLASS} w-40`}
            placeholder="value"
            value={option.value}
            onChange={(event) => {
              update(index, { value: event.target.value });
            }}
          />
          {showScores && (
            <input
              className={`${CONTROL_CLASS} w-20`}
              type="number"
              placeholder="score"
              value={option.score ?? ''}
              onChange={(event) => {
                update(index, {
                  score: event.target.value === '' ? undefined : Number(event.target.value),
                });
              }}
            />
          )}
          <button
            type="button"
            aria-label="Remove option"
            onClick={() => {
              removeOption(index);
            }}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Icon name={Icons.TRASH2} styleProps={{ size: 'sm', colour: 'currentColor' }} />
          </button>
        </div>
      ))}

      <Button
        variant="secondary"
        size="sm"
        icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
        onClick={addOption}
      >
        Add option
      </Button>
    </div>
  );
};
