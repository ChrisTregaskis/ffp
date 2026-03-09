import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { useClickOutside } from '@web/hooks/useClickOutside';

import type { ReactNode } from 'react';

export interface DropdownMenuItem {
  /** Display label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Visual variant */
  variant?: 'default' | 'danger';
  /** Disabled state */
  disabled?: boolean;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DropdownMenuProps {
  /** Button label */
  label: string;
  /** Menu items (required unless renderContent is provided) */
  items?: DropdownMenuItem[];
  /** Custom dropdown content (replaces the default menu item list) */
  renderContent?: () => ReactNode;
  /** Button size @default 'sm' */
  size?: 'sm' | 'md';
  /** Additional classes on the outer wrapper */
  className?: string;
}

/**
 * Dropdown menu component.
 *
 * Renders a Button-styled trigger that opens a dropdown list of actions.
 * Supports either structured menu items or custom content via renderContent.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  items,
  renderContent,
  size = 'sm',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uniqueId = useId();
  const menuId = `${uniqueId}-menu`;

  const hasItems = items != null && items.length > 0;
  const hasContent = renderContent != null;

  // Close on click outside
  useClickOutside(
    containerRef,
    () => {
      setIsOpen(false);
    },
    isOpen
  );

  // Scroll highlighted item into view (only for items mode)
  useEffect(() => {
    if (!isOpen || !hasItems || highlightedIndex < 0 || !listRef.current) {
      return;
    }

    const menuItems = listRef.current.querySelectorAll('[role="menuitem"]');
    menuItems[highlightedIndex].scrollIntoView({ block: 'nearest' });
  }, [isOpen, hasItems, highlightedIndex]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && hasItems) {
        setHighlightedIndex(0);
      }

      return !prev;
    });
  }, [hasItems]);

  const handleSelect = useCallback((item: DropdownMenuItem) => {
    if (item.disabled) {
      return;
    }

    item.onClick();
    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!hasItems) {
        // For renderContent mode, only handle Escape
        if (event.key === 'Escape' && isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }

        return;
      }

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
    [isOpen, highlightedIndex, items, hasItems, handleSelect, handleToggle]
  );

  if (!hasItems && !hasContent) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      {/* Trigger button */}
      <Button
        variant="secondary"
        size={size}
        aria-expanded={isOpen}
        aria-haspopup={hasItems ? 'menu' : 'true'}
        aria-controls={isOpen ? menuId : undefined}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        onKeyDown={handleKeyDown}
        icon={
          <Icon
            name={Icons.CHEVRONDOWN}
            styleProps={{
              size: 'xs',
              colour: 'currentColor',
              className: `transition-transform ${isOpen ? 'rotate-180' : ''}`,
            }}
          />
        }
        iconPosition="right"
      >
        {label}
      </Button>

      {/* Dropdown panel */}
      {isOpen && hasContent && !hasItems && (
        <div
          id={menuId}
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-auto rounded-md border border-border bg-white shadow-lg max-h-60"
        >
          {renderContent()}
        </div>
      )}

      {isOpen && hasItems && (
        <ul
          ref={listRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-auto rounded-md border border-border bg-white shadow-lg max-h-60"
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
