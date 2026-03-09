import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { useClickOutside } from '@web/hooks/useClickOutside';

import type { SelectOption } from './types';
import type { ReactNode } from 'react';

export interface BaseSelectRenderTriggerProps {
  /** Whether the dropdown is open */
  isOpen: boolean;
  /** The currently selected option, if any */
  selectedOption: SelectOption | undefined;
  /** Toggle the dropdown open/closed */
  onToggle: () => void;
  /** Keyboard handler — attach to the trigger element */
  onKeyDown: (event: React.KeyboardEvent) => void;
  /** ID of the listbox element (for aria-controls) */
  listboxId: string;
}

export interface BaseSelectProps {
  /** Current value */
  value: string | number;
  /** Change handler */
  onChange: (value: string | number) => void;
  /** Available options */
  options: SelectOption[];
  /** Accessible label for the listbox */
  listboxAriaLabel: string;
  /** Render the trigger button */
  renderTrigger: (props: BaseSelectRenderTriggerProps) => ReactNode;
  /** Additional classes on the outer wrapper */
  className?: string;
}

/**
 * Headless select component.
 *
 * Manages open/close state, keyboard navigation, scroll-into-view,
 * and click-outside behaviour. Delegates trigger rendering to consumers
 * via the `renderTrigger` prop.
 */
export const BaseSelect: React.FC<BaseSelectProps> = ({
  value,
  onChange,
  options,
  listboxAriaLabel,
  renderTrigger,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uniqueId = useId();
  const listboxId = `${uniqueId}-listbox`;

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on click outside
  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
    },
    isOpen
  );

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
        const selectedIdx = options.findIndex((opt) => String(opt.value) === String(value));
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
      }

      return !prev;
    });
  }, [options, value]);

  const handleSelect = useCallback(
    (option: SelectOption) => {
      onChange(option.value);
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
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {renderTrigger({
        isOpen,
        selectedOption,
        onToggle: handleToggle,
        onKeyDown: handleKeyDown,
        listboxId,
      })}

      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={listboxAriaLabel}
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
  );
};
