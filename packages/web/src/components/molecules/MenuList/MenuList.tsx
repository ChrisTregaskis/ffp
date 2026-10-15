import React from 'react';

import { FloatingPanel } from '@web/components/atoms';

import type { CSSProperties, KeyboardEvent, Ref } from 'react';

export interface MenuListItem {
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

export interface MenuListProps {
  id: string;
  /** Accessible name for the menu */
  ariaLabel: string;
  items: MenuListItem[];
  /** The item holding focus; it alone takes `tabIndex={0}` */
  activeIndex: number;
  onActivate: (index: number) => void;
  /** Fired as the pointer enters an item */
  onHover: (index: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  forwardedRef?: Ref<HTMLUListElement>;
  /** Position and size classes */
  className?: string;
  style?: CSSProperties;
}

/**
 * The floating list of a menu button: a `role="menu"` of `role="menuitem"` entries with
 * roving focus. `useMenuButton` supplies its state and handlers.
 */
export const MenuList: React.FC<MenuListProps> = ({
  id,
  ariaLabel,
  items,
  activeIndex,
  onActivate,
  onHover,
  onKeyDown,
  forwardedRef,
  className,
  style,
}) => (
  <FloatingPanel
    as="ul"
    forwardedRef={forwardedRef}
    id={id}
    role="menu"
    aria-label={ariaLabel}
    onKeyDown={onKeyDown}
    className={className}
    style={style}
  >
    {items.map((item, index) => {
      const isActive = index === activeIndex;

      return (
        <li
          key={item.label}
          role="menuitem"
          tabIndex={isActive ? 0 : -1}
          aria-disabled={item.disabled}
          onClick={(e) => {
            // Table rows are clickable; choosing an action must not open the row
            e.stopPropagation();
            onActivate(index);
          }}
          onMouseEnter={() => {
            onHover(index);
          }}
          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none ${
            item.disabled ? 'cursor-not-allowed opacity-50' : ''
          } ${isActive ? 'bg-primary/10' : ''} ${
            item.variant === 'danger' ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          {item.label}
        </li>
      );
    })}
  </FloatingPanel>
);
