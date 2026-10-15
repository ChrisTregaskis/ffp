import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Button, FloatingPanel, Icon, Icons } from '@web/components/atoms';
import { MenuList, type MenuListItem } from '@web/components/molecules';
import { useClickOutside } from '@web/hooks/useClickOutside';
import { useMenuButton } from '@web/hooks/useMenuButton';
import { getFocusableElements } from '@web/utils/focusable';

import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';

export type DropdownMenuItem = MenuListItem;

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

const NO_ITEMS: DropdownMenuItem[] = [];

/**
 * Dropdown menu component.
 *
 * Renders a Button-styled trigger that opens either a menu of actions or, with
 * renderContent, a popover of custom content. The panel is portalled to escape
 * overflow:hidden containers.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  items,
  renderContent,
  size = 'sm',
  className,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0, minWidth: 140 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverTriggerRef = useRef<HTMLElement | null>(null);
  const popoverId = `${useId()}-popover`;

  const hasItems = items != null && items.length > 0;
  const hasContent = renderContent != null;

  // The portal is placed once, from the trigger, as the panel opens
  const placePanel = useCallback((): void => {
    if (!containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    setPanelPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
      minWidth: Math.max(140, rect.width),
    });
  }, []);

  const menu = useMenuButton(items ?? NO_ITEMS, placePanel);
  const { close: closeMenu, menuRef } = menu;

  // Focus left in the panel would drop to <body> as it unmounts, so it returns to the trigger
  const closePopover = useCallback((): void => {
    const active = document.activeElement;
    setIsPopoverOpen(false);

    if (active instanceof Node && popoverRef.current?.contains(active)) {
      popoverTriggerRef.current?.focus({ preventScroll: true });
    }
  }, []);

  useClickOutside([containerRef, popoverRef], closePopover, isPopoverOpen);

  const isOpen = hasItems ? menu.isOpen : isPopoverOpen;

  // The panel is portalled to the end of <body>, out of the trigger's tab order, so focus is taken in
  useEffect(() => {
    const panel = popoverRef.current;

    if (!isPopoverOpen || !panel) {
      return;
    }

    (getFocusableElements(panel).at(0) ?? panel).focus({ preventScroll: true });
  }, [isPopoverOpen]);

  // A scroll would leave the portal behind its trigger, so collapse instead of repositioning
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleScroll = (event: Event): void => {
      const panel = hasItems ? menuRef.current : popoverRef.current;

      if (event.target instanceof Node && panel?.contains(event.target)) {
        return;
      }

      if (hasItems) {
        closeMenu();
      } else {
        closePopover();
      }
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, hasItems, menuRef, closeMenu, closePopover]);

  const handlePopoverToggle = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      event.stopPropagation();

      if (!isPopoverOpen) {
        popoverTriggerRef.current = event.currentTarget;
        placePanel();
      }

      setIsPopoverOpen(!isPopoverOpen);
    },
    [isPopoverOpen, placePanel]
  );

  const handlePopoverKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (event.key === 'Escape' && isPopoverOpen) {
        event.preventDefault();
        // Keeps an enclosing dialog's Escape from also firing
        event.stopPropagation();
        setIsPopoverOpen(false);
        popoverTriggerRef.current?.focus();
      }
    },
    [isPopoverOpen]
  );

  // Tabbing past either end leaves the popover, back to its trigger, rather than into the browser
  const handlePanelKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      if (event.key !== 'Tab') {
        handlePopoverKeyDown(event);

        return;
      }

      const panel = popoverRef.current;
      const focusable = panel ? getFocusableElements(panel) : [];
      const edge = event.shiftKey ? focusable.at(0) : focusable.at(-1);
      // A click on the panel's padding focuses the panel itself, which sits before its first control
      const isLeavingFromPanel = event.shiftKey && document.activeElement === panel;

      if (edge === undefined || document.activeElement === edge || isLeavingFromPanel) {
        event.preventDefault();
        closePopover();
      }
    },
    [handlePopoverKeyDown, closePopover]
  );

  if (!hasItems && !hasContent) {
    return null;
  }

  const triggerProps = hasItems
    ? menu.triggerProps
    : {
        'aria-haspopup': 'dialog' as const,
        'aria-expanded': isPopoverOpen,
        'aria-controls': isPopoverOpen ? popoverId : undefined,
        onClick: handlePopoverToggle,
        onKeyDown: handlePopoverKeyDown,
      };

  const panelStyle: CSSProperties = {
    position: 'absolute',
    top: panelPosition.top,
    left: panelPosition.left,
    transform: 'translateX(-100%)',
    minWidth: panelPosition.minWidth,
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className ?? ''}`}>
      <Button
        variant="secondary"
        size={size}
        {...triggerProps}
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

      {isPopoverOpen &&
        hasContent &&
        !hasItems &&
        createPortal(
          <FloatingPanel
            forwardedRef={popoverRef}
            id={popoverId}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={handlePanelKeyDown}
            style={panelStyle}
          >
            {renderContent()}
          </FloatingPanel>,
          document.body
        )}

      {menu.isOpen &&
        hasItems &&
        createPortal(
          <MenuList
            id={menu.menuId}
            ariaLabel={label}
            items={items}
            activeIndex={menu.activeIndex}
            onActivate={menu.activate}
            onHover={menu.focusItem}
            onKeyDown={menu.onMenuKeyDown}
            forwardedRef={menuRef}
            style={panelStyle}
          />,
          document.body
        )}
    </div>
  );
};
