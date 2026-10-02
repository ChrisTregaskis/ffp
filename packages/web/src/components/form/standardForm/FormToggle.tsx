import { useController } from 'react-hook-form';

import { Switch } from '@web/components/atoms/Switch';
import { Text } from '@web/components/text';

import type { Control, FieldValues, Path } from 'react-hook-form';

export interface FormToggleProps<TFieldValues extends FieldValues> {
  /** Must name a boolean field */
  name: Path<TFieldValues>;
  label: string;
  /** Short explanation shown under the label */
  hint?: string;
  control: Control<TFieldValues>;
  disabled?: boolean;
}

/** A labelled `Switch` bound to a boolean form field. */
export const FormToggle = <TFieldValues extends FieldValues>({
  name,
  label,
  hint,
  control,
  disabled = false,
}: FormToggleProps<TFieldValues>): JSX.Element => {
  const {
    field: { value, onChange, onBlur },
  } = useController({ name, control });

  const inputId = String(name);
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <label htmlFor={inputId}>
          <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
            {label}
          </Text>
        </label>
        {hint && (
          <Text as="p" id={hintId} styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {hint}
          </Text>
        )}
      </div>
      <Switch
        id={inputId}
        checked={value === true}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        ariaDescribedBy={hintId}
      />
    </div>
  );
};
