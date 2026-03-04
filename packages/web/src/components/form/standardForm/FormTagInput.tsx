import { useCallback, useMemo, useState } from 'react';
import { useController } from 'react-hook-form';

import { Icon } from '@web/components/Icon/Icon';
import { Text } from '@web/components/text';

import type { Control, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface FormTagInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
}

/**
 * Tag input field component for standard forms
 *
 * Allows entering multiple string values as tags. Press Enter or comma
 * to add a tag. Click the remove button to delete a tag.
 * Stores the value as a string array in react-hook-form.
 */
export const FormTagInput = <TFieldValues extends FieldValues>({
  name,
  label,
  placeholder = 'Type and press Enter',
  control,
  errors,
  isRequired,
}: FormTagInputProps<TFieldValues>): JSX.Element => {
  const [inputValue, setInputValue] = useState('');
  const error = errors[name]?.message as string | undefined;
  const inputId = String(name);
  const errorId = `${inputId}-error`;

  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue: [] as unknown as TFieldValues[Path<TFieldValues>],
  });

  const tags = useMemo(() => (value as string[] | undefined) ?? [], [value]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase();

      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }

      setInputValue('');
    },
    [tags, onChange]
  );

  const removeTag = useCallback(
    (index: number) => {
      const updated = tags.filter((_, i) => i !== index);

      onChange(updated);
    },
    [tags, onChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();

        if (inputValue.trim()) {
          addTag(inputValue);
        }
      }

      // Remove last tag on Backspace when input is empty
      if (event.key === 'Backspace' && !inputValue && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    },
    [inputValue, addTag, removeTag, tags.length]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  }, [inputValue, addTag]);

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block mb-1">
        <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
          {label}
        </Text>
        {isRequired && (
          <Text styleProps={{ colour: 'destructive' }} className="ml-1">
            *
          </Text>
        )}
      </label>

      <div
        className={`
          flex flex-wrap items-center gap-1.5 min-h-[42px] px-2 py-1.5 border rounded-md shadow-sm
          focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
      >
        {tags.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-sm text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => {
                removeTag(index);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <Icon name="Close" styleProps={{ size: 'xs', colour: 'currentColor' }} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          aria-required={isRequired}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="flex-1 min-w-[120px] border-0 px-1 py-0.5 text-sm outline-none bg-transparent"
        />
      </div>

      {error && (
        <Text
          as="p"
          id={errorId}
          styleProps={{ size: 'sm', colour: 'destructive' }}
          className="mt-1"
          role="alert"
        >
          {error}
        </Text>
      )}
    </div>
  );
};
