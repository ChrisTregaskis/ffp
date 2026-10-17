import React from 'react';

import { IconButton, Icons } from '@web/components/atoms';
import { MenuList, type MenuListItem } from '@web/components/molecules';
import { useMenuButton } from '@web/hooks/useMenuButton';

export interface KebabMenuProps {
  /** Menu items to display */
  items: MenuListItem[];
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
 * Renders a MoreHorizontal icon button that opens a menu of actions.
 * Reusable across cards, rows, and any UI needing a compact actions menu.
 */
export const KebabMenu: React.FC<KebabMenuProps> = ({
  items,
  ariaLabel = 'More actions',
  disabled = false,
  className,
}) => {
  const menu = useMenuButton(items);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`relative inline-block ${className ?? ''}`}>
      <IconButton
        icon={Icons.MOREHORIZONTAL}
        size="sm"
        ariaLabel={ariaLabel}
        disabled={disabled}
        className="rounded-md p-1 hover:bg-muted"
        {...menu.triggerProps}
      />

      {menu.isOpen && (
        <MenuList
          id={menu.menuId}
          ariaLabel={ariaLabel}
          items={items}
          activeIndex={menu.activeIndex}
          onActivate={menu.activate}
          onHover={menu.focusItem}
          onKeyDown={menu.onMenuKeyDown}
          forwardedRef={menu.menuRef}
          className="absolute right-0 mt-1 min-w-[160px]"
        />
      )}
    </div>
  );
};
