import { Text } from '@web/components/text';

import { CONTROL_CLASS } from './prototype-styles';
import { PrototypeField } from './PrototypeField';
import { ToggleSwitch } from './ToggleSwitch';

import type { QuestionType, QuestionValidation } from './prototype-types';

interface ValidationFieldsetProps {
  type: QuestionType;
  validation: QuestionValidation;
  onChange: (validation: QuestionValidation) => void;
}

const numberOrUndefined = (raw: string): number | undefined =>
  raw === '' ? undefined : Number(raw);

/** Type-aware validation editor for a question. */
export const ValidationFieldset: React.FC<ValidationFieldsetProps> = ({
  type,
  validation,
  onChange,
}) => {
  const patch = (next: Partial<QuestionValidation>): void => {
    onChange({ ...validation, ...next });
  };

  const showRange = type === 'numeric' || type === 'scale' || type === 'video-response';
  const showMaxLength = type === 'text';
  const showPattern = type === 'text';

  const minLabel = type === 'scale' ? 'Lowest value' : 'Minimum';
  const maxLabel = type === 'scale' ? 'Highest value' : 'Maximum';

  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-4">
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>Validation</Text>

      <ToggleSwitch
        checked={validation.required ?? false}
        onChange={(checked) => {
          patch({ required: checked });
        }}
        label="Required"
        hint="Members must answer before continuing."
      />

      {showRange && (
        <div className="grid grid-cols-2 gap-3">
          <PrototypeField label={minLabel}>
            <input
              className={CONTROL_CLASS}
              type="number"
              value={validation.min ?? ''}
              onChange={(event) => {
                patch({ min: numberOrUndefined(event.target.value) });
              }}
            />
          </PrototypeField>
          <PrototypeField label={maxLabel}>
            <input
              className={CONTROL_CLASS}
              type="number"
              value={validation.max ?? ''}
              onChange={(event) => {
                patch({ max: numberOrUndefined(event.target.value) });
              }}
            />
          </PrototypeField>
        </div>
      )}

      {showMaxLength && (
        <PrototypeField label="Maximum length" hint="Maximum number of characters.">
          <input
            className={CONTROL_CLASS}
            type="number"
            value={validation.max ?? ''}
            onChange={(event) => {
              patch({ max: numberOrUndefined(event.target.value) });
            }}
          />
        </PrototypeField>
      )}

      {showPattern && (
        <PrototypeField
          label="Pattern (optional)"
          hint="A regular expression the answer must match."
        >
          <input
            className={CONTROL_CLASS}
            value={validation.pattern ?? ''}
            placeholder="e.g. ^[A-Za-z ]+$"
            onChange={(event) => {
              patch({ pattern: event.target.value || undefined });
            }}
          />
        </PrototypeField>
      )}
    </div>
  );
};
