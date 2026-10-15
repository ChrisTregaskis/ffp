import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { MenuListItem } from '@web/components/molecules';

import { useClickOutside } from './useClickOutside';

import type { KeyboardEvent, MouseEvent, RefObject } from 'react';

export interface MenuButtonTriggerProps {
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls': string | undefined;
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export interface MenuButton {
  isOpen: boolean;
  /** The item holding focus, or -1 */
  activeIndex: number;
  menuId: string;
  /** Attach to the menu's list element */
  menuRef: RefObject<HTMLUListElement>;
  /** Spread onto the trigger button */
  triggerProps: MenuButtonTriggerProps;
  onMenuKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Closes the menu and returns focus to the trigger */
  close: () => void;
  /** Runs an item's action and closes the menu; a disabled item does nothing */
  activate: (index: number) => void;
  /** Moves focus to an item, as a pointer does on hover */
  focusItem: (index: number) => void;
}

/** The next enabled index from `from` in `direction`, wrapping; -1 if every item is disabled */
const findEnabled = (items: readonly MenuListItem[], from: number, direction: 1 | -1): number => {
  const count = items.length;

  for (let offset = 1; offset <= count; offset += 1) {
    const index = (((from + direction * offset) % count) + count) % count;

    if (!items[index]?.disabled) {
      return index;
    }
  }

  return -1;
};

/**
 * Hook implementing the WAI-ARIA menu button pattern.
 *
 * Opening by click, Enter, Space or ArrowDown focuses the first enabled item; ArrowUp
 * opens on the last. Arrows move focus and wrap, Home and End jump to the ends, and
 * disabled items are skipped. Enter and Space activate. Escape closes and returns focus
 * to the trigger; Tab closes and lets focus move on from the trigger. Clicking outside
 * closes. Items take a roving `tabIndex`: 0 on the active one, -1 on the rest.
 *
 * @param items - The menu's items, in order
 * @param onOpen - Callback fired as the menu opens, before it renders
 */
export const useMenuButton = (items: readonly MenuListItem[], onOpen?: () => void): MenuButton => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = `${useId()}-menu`;

  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const openAt = useCallback((index: number, trigger: HTMLElement): void => {
    triggerRef.current = trigger;
    onOpenRef.current?.();
    setActiveIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback((restoreFocus: boolean): void => {
    setIsOpen(false);
    setActiveIndex(-1);

    if (restoreFocus) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, []);

  const closeAndRestoreFocus = useCallback((): void => {
    close(true);
  }, [close]);

  useClickOutside(
    [triggerRef, menuRef],
    () => {
      close(false);
    },
    isOpen
  );

  useEffect(() => {
    if (!isOpen || activeIndex < 0) {
      return;
    }

    const list = menuRef.current;
    const item = list?.querySelectorAll<HTMLElement>('[role="menuitem"]')[activeIndex];

    if (!list || !item) {
      return;
    }

    // A portalled menu closes on a page scroll, so only the list scrolls to the item
    item.focus({ preventScroll: true });

    if (item.offsetTop < list.scrollTop) {
      list.scrollTop = item.offsetTop;
    } else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
    }
  }, [isOpen, activeIndex]);

  const activate = useCallback(
    (index: number): void => {
      const item = index >= 0 ? items.at(index) : undefined;

      if (!item || item.disabled) {
        return;
      }

      // Focus goes back first, so a dialog the action opens restores focus to the trigger
      close(true);
      item.onClick();
    },
    [items, close]
  );

  const focusItem = useCallback(
    (index: number): void => {
      if (!items[index]?.disabled) {
        setActiveIndex(index);
      }
    },
    [items]
  );

  const handleTriggerClick = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      // Table rows are clickable; opening a row's menu must not open the row
      event.stopPropagation();

      if (isOpen) {
        close(false);

        return;
      }

      openAt(findEnabled(items, -1, 1), event.currentTarget);
    },
    [isOpen, items, close, openAt]
  );

  const handleTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      switch (event.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown': {
          event.preventDefault();
          openAt(findEnabled(items, -1, 1), event.currentTarget);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          openAt(findEnabled(items, items.length, -1), event.currentTarget);
          break;
        }
        // Focus stays on the trigger only when every item is disabled
        case 'Escape': {
          if (isOpen) {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }

          break;
        }
        case 'Tab': {
          if (isOpen) {
            close(false);
          }

          break;
        }
      }
    },
    [isOpen, items, close, openAt]
  );

  const onMenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setActiveIndex(findEnabled(items, activeIndex, 1));
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setActiveIndex(findEnabled(items, activeIndex, -1));
          break;
        }
        case 'Home': {
          event.preventDefault();
          setActiveIndex(findEnabled(items, -1, 1));
          break;
        }
        case 'End': {
          event.preventDefault();
          setActiveIndex(findEnabled(items, items.length, -1));
          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();
          activate(activeIndex);
          break;
        }
        case 'Escape': {
          event.preventDefault();
          // Keeps an enclosing dialog's Escape from also firing
          event.stopPropagation();
          close(true);
          break;
        }
        case 'Tab': {
          // Not prevented: the browser's Tab then moves on from the trigger
          close(true);
          break;
        }
      }
    },
    [items, activeIndex, activate, close]
  );

  return {
    isOpen,
    activeIndex,
    menuId,
    menuRef,
    close: closeAndRestoreFocus,
    triggerProps: {
      'aria-haspopup': 'menu',
      'aria-expanded': isOpen,
      'aria-controls': isOpen ? menuId : undefined,
      onClick: handleTriggerClick,
      onKeyDown: handleTriggerKeyDown,
    },
    onMenuKeyDown,
    activate,
    focusItem,
  };
};
