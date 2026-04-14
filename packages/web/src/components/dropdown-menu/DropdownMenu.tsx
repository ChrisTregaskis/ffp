import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';

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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 140,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const portalContentRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const menuId = `${uniqueId}-menu`;

  const hasItems = items != null && items.length > 0;
  const hasContent = renderContent != null;

  // Close on click outside — must check both trigger container and portaled dropdown
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent): void => {
      const target = event.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inPortal = hasItems
        ? listRef.current?.contains(target)
        : portalContentRef.current?.contains(target);

      if (!inTrigger && !inPortal) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, hasItems]);

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
      if (!prev) {
        // Calculate position from trigger button before opening
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDropdownPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.right + window.scrollX,
            minWidth: Math.max(140, rect.width),
          });
        }

        if (hasItems) {
          setHighlightedIndex(0);
        }
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

      {/* Dropdown panel — rendered via portal to escape overflow:hidden containers */}
      {isOpen &&
        hasContent &&
        !hasItems &&
        createPortal(
          <div
            ref={portalContentRef}
            id={menuId}
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              transform: 'translateX(-100%)',
              minWidth: dropdownPos.minWidth,
            }}
            className="z-50 overflow-auto rounded-md border border-border bg-white shadow-lg max-h-60"
          >
            {renderContent()}
          </div>,
          document.body
        )}

      {isOpen &&
        hasItems &&
        createPortal(
          <ul
            ref={listRef}
            id={menuId}
            role="menu"
            aria-label={label}
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              transform: 'translateX(-100%)',
              minWidth: dropdownPos.minWidth,
            }}
            className="z-50 overflow-auto rounded-md border border-border bg-white shadow-lg max-h-60"
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
          </ul>,
          document.body
        )}
    </div>
  );
};
