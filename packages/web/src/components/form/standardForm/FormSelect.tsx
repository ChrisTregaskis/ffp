// Design reference: https://carbondesignsystem.com/components/dropdown/usage/
// For when we look to align new inputs or current ones

import { useCallback, useEffect, useRef, useState } from 'react';
import { useController } from 'react-hook-form';

import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text';

import { getInputClassName } from '../shared/inputStyles';

import { FormField } from './FormField';

import type { Control, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface FormSelectProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  isRequired?: boolean;
}

/**
 * Custom dropdown select component for standard forms.
 *
 * Replaces native `<select>` with a fully accessible custom dropdown.
 */
export const FormSelect = <TFieldValues extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  control,
  errors,
  isRequired,
}: FormSelectProps<TFieldValues>): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const error = errors[name]?.message as string | undefined;
  const inputId = String(name);
  const errorId = `${inputId}-error`;
  const listboxId = `${inputId}-listbox`;

  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    defaultValue: '' as TFieldValues[Path<TFieldValues>],
  });

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on click outside
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !listRef.current) {
      return;
    }

    const items = listRef.current.querySelectorAll('[role="option"]');
    items[highlightedIndex].scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        // Opening: highlight selected option or first
        const selectedIdx = options.findIndex((opt) => String(opt.value) === String(value));
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
      }

      return !prev;
    });
  }, [options, value]);

  const handleSelect = useCallback(
    (option: SelectOption) => {
      onChange(option.value as TFieldValues[Path<TFieldValues>]);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();

          if (!isOpen) {
            setIsOpen(true);
            const selectedIdx = options.findIndex((opt) => String(opt.value) === String(value));
            setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
          } else {
            setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
          }

          break;
        }
        case 'ArrowUp': {
          event.preventDefault();

          if (isOpen) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          }

          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();

          if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleSelect(options[highlightedIndex]);
          } else if (!isOpen) {
            handleToggle();
          }

          break;
        }
        case 'Escape': {
          if (isOpen) {
            event.preventDefault();
            setIsOpen(false);
          }

          break;
        }
        case 'Tab': {
          if (isOpen) {
            setIsOpen(false);
          }

          break;
        }
      }
    },
    [isOpen, highlightedIndex, options, value, handleSelect, handleToggle]
  );

  return (
    <FormField
      htmlFor={inputId}
      label={label}
      isRequired={isRequired}
      error={error}
      errorId={errorId}
    >
      <div ref={containerRef} className="relative">
        {/* Trigger button */}
        <button
          id={inputId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-required={isRequired}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`${getInputClassName(!!error)} flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left`}
        >
          {selectedOption ? (
            <Text>{selectedOption.label}</Text>
          ) : (
            <Text styleProps={{ colour: 'muted-foreground' }}>{placeholder ?? 'Select...'}</Text>
          )}
          <Icon
            name={Icons.CHEVRONDOWN}
            styleProps={{ size: 'sm', colour: 'var(--color-muted-foreground)' }}
          />
        </button>

        {/* Options list */}
        {isOpen && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="absolute z-50 mt-1 w-full overflow-auto rounded-md border border-border bg-white shadow-lg max-h-60"
          >
            {options.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = index === highlightedIndex;

              return (
                <li
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    handleSelect(option);
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(index);
                  }}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    isHighlighted ? 'bg-primary/10' : ''
                  } ${isSelected ? 'font-medium text-primary' : 'text-foreground'}`}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FormField>
  );
};
