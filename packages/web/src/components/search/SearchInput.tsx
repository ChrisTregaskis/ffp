import { useCallback, useRef } from 'react';

import { IconButton } from '@web/components/button/IconButton';
import { getInputClassName } from '@web/components/form/shared/inputStyles';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

export interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text @default 'Search...' */
  placeholder?: string;
  /** Accessible label @default 'Search' */
  ariaLabel?: string;
  /** Additional classes on the outer wrapper */
  className?: string;
}

/**
 * Standalone search input with search icon and clear button.
 *
 * No React Hook Form dependency — pure value/onChange props.
 * Debouncing is handled externally (e.g. by useApiTable).
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  ariaLabel = 'Search',
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Search icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon
          name={Icons.SEARCH}
          styleProps={{ size: 'sm', colour: 'var(--color-muted-foreground)' }}
        />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${getInputClassName(false, 'input', true)} w-full py-1.5 pl-9 pr-8 text-sm`}
      />

      {/* Clear button */}
      {value.length > 0 && (
        <IconButton
          icon={Icons.CLOSE}
          size="sm"
          onClick={handleClear}
          ariaLabel="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground hover:text-foreground"
        />
      )}
    </div>
  );
};
