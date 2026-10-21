import { useController } from 'react-hook-form';

import { Checkbox, FieldError, Label, Text } from '@web/components/atoms';
import { getFieldDescriptionIds } from '@web/utils/field-description';
import { getFieldErrorMessage } from '@web/utils/field-error';

import type { Control, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface CheckboxGroupOption {
  label: string;
  value: string;
}

export interface FormCheckboxGroupProps<TFieldValues extends FieldValues> {
  /** Must name a string-array field */
  name: Path<TFieldValues>;
  label: string;
  options: CheckboxGroupOption[];
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  /** Short guidance shown under the options */
  hint?: string;
  disabled?: boolean;
}

/** A labelled group of checkboxes bound to a string-array form field, one value per option. */
export const FormCheckboxGroup = <TFieldValues extends FieldValues>({
  name,
  label,
  options,
  control,
  errors,
  hint,
  disabled = false,
}: FormCheckboxGroupProps<TFieldValues>): JSX.Element => {
  const {
    field: { value, onChange, onBlur },
  } = useController({ name, control });

  const selected = (value as string[] | undefined) ?? [];
  const groupId = String(name);
  const error = getFieldErrorMessage(errors, name);
  const { hintId, errorId, describedBy } = getFieldDescriptionIds(groupId, { hint, error });

  const toggle = (optionValue: string): void => {
    onChange(
      selected.includes(optionValue)
        ? selected.filter((item) => item !== optionValue)
        : [...selected, optionValue]
    );
  };

  return (
    <fieldset className="mb-4" aria-describedby={describedBy}>
      <legend className="mb-1">
        <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
          {label}
        </Text>
      </legend>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((option) => (
          <Label
            key={option.value}
            variant="option"
            className="flex items-center gap-2"
            control={
              <Checkbox
                name={groupId}
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={() => {
                  toggle(option.value);
                }}
                onBlur={onBlur}
                disabled={disabled}
              />
            }
          >
            {option.label}
          </Label>
        ))}
      </div>

      {hint && (
        <Text
          as="p"
          id={hintId}
          styleProps={{ size: 'xs', colour: 'muted-foreground' }}
          className="mt-1"
        >
          {hint}
        </Text>
      )}

      {error && <FieldError id={errorId} message={error} />}
    </fieldset>
  );
};
