import React from 'react';

import { IconButton } from '@web/components/atoms';
import { REORDERABLE_ACTION_LABELS } from '@web/components/dropdown-menu';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

import type { QuestionFormValues, QuestionOptionFormValues } from '../types';

type OptionField = keyof QuestionOptionFormValues;

const optionPath = <TField extends OptionField>(
  index: number,
  field: TField
): `options.${number}.${TField}` =>
  `options.${index.toString()}.${field}` as `options.${number}.${TField}`;

export interface QuestionOptionRowProps {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  /** A choice question needs at least two options, so the last two cannot go */
  canRemove: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

/** One answer option: what the member sees, the stored value, and its score. */
export const QuestionOptionRow: React.FC<QuestionOptionRowProps> = ({
  index,
  isFirst,
  isLast,
  canRemove,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const { register, errors, watch } = useComposableFormContext<QuestionFormValues>();
  const position = String(index + 1);
  const isStored = watch(optionPath(index, 'isStored'));

  return (
    <div className="mb-3 flex items-start gap-3 rounded-md border border-border p-3">
      <div className="grid flex-1 grid-cols-1 gap-x-4 sm:grid-cols-[2fr_1fr_7rem]">
        <FormTextInput<QuestionFormValues>
          name={optionPath(index, 'label')}
          label={`Option ${position}`}
          placeholder="What the member sees"
          register={register}
          errors={errors}
          isRequired
          registerOptions={{ required: 'Give the option a label' }}
        />
        <FormTextInput<QuestionFormValues>
          name={optionPath(index, 'value')}
          label="Stored value"
          placeholder="e.g. rarely"
          register={register}
          errors={errors}
          isRequired
          readOnly={isStored}
          registerOptions={{
            required: 'Give the option a value',
            validate: (value, formValues) =>
              formValues.options.filter((option) => option.value.trim() === String(value).trim())
                .length <= 1 || 'Each option needs its own value',
          }}
        />
        <FormNumberInput<QuestionFormValues>
          name={optionPath(index, 'score')}
          label="Score"
          placeholder="None"
          step="any"
          register={register}
          errors={errors}
        />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 pt-7">
        <IconButton
          icon="ArrowUp"
          size="sm"
          ariaLabel={`${REORDERABLE_ACTION_LABELS.moveUp}: option ${position}`}
          onClick={onMoveUp}
          disabled={isFirst}
        />
        <IconButton
          icon="ArrowDown"
          size="sm"
          ariaLabel={`${REORDERABLE_ACTION_LABELS.moveDown}: option ${position}`}
          onClick={onMoveDown}
          disabled={isLast}
        />
        <IconButton
          icon="Trash2"
          size="sm"
          colour="var(--color-destructive)"
          ariaLabel={`Remove option ${position}`}
          onClick={onRemove}
          disabled={!canRemove}
        />
      </div>
    </div>
  );
};
