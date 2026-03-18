import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { useClickOutside } from '@web/hooks/useClickOutside';

import type { DropdownMenuItem } from './DropdownMenu';

export interface KebabMenuProps {
  /** Menu items to display */
  items: DropdownMenuItem[];
  /** Accessible label for the trigger button @default "More actions" */
  ariaLabel?: string;
  /** Whether the trigger is disabled */
  disabled?: boolean;
  /** Additional classes on the outer wrapper */
  className?: string;
}

/**
 * Three-dot (kebab) menu component.
 *
 * Renders a MoreHorizontal icon button that opens a dropdown list of actions.
 * Reusable across cards, rows, and any UI needing a compact actions menu.
 */
export const KebabMenu: React.FC<KebabMenuProps> = ({
  items,
  ariaLabel = 'More actions',
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uniqueId = useId();
  const menuId = `${uniqueId}-kebab-menu`;

  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
    },
    isOpen
  );

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !listRef.current) {
      return;
    }

    const menuItems = listRef.current.querySelectorAll('[role="menuitem"]');
    menuItems[highlightedIndex].scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setHighlightedIndex(0);
      }

      return !prev;
    });
  }, []);

  const handleSelect = useCallback((item: DropdownMenuItem) => {
    if (item.disabled) {
      return;
    }

    item.onClick();
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();

          if (!isOpen) {
            setIsOpen(true);
            setHighlightedIndex(0);
          } else {
            setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
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

          if (isOpen && highlightedIndex >= 0 && highlightedIndex < items.length) {
            handleSelect(items[highlightedIndex]);
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
    [isOpen, highlightedIndex, items, handleSelect, handleToggle]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name={Icons.MOREHORIZONTAL} styleProps={{ size: 'sm', colour: 'currentColor' }} />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          className="absolute right-0 z-50 mt-1 min-w-[160px] max-h-60 overflow-auto rounded-md border border-border bg-white shadow-lg"
        >
          {items.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            const isDanger = item.variant === 'danger';

            return (
              <li
                key={item.label}
                role="menuitem"
                aria-disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(item);
                }}
                onMouseEnter={() => {
                  setHighlightedIndex(index);
                }}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${
                  item.disabled ? 'pointer-events-none opacity-50' : ''
                } ${isHighlighted ? 'bg-primary/10' : ''} ${
                  isDanger ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
