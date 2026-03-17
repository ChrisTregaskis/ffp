import React, { useCallback, useState } from 'react';

import { Icon } from '@web/components/Icon';
import { Icons } from '@web/components/Icon/types';

import type { ReactNode } from 'react';

export interface AccordionProps {
  /** Content rendered in the header row alongside the chevron */
  trigger: ReactNode;
  /** Actions rendered on the right side of the header (e.g. icon buttons) */
  actions?: ReactNode;
  /** Collapsible body content */
  children: ReactNode;
  /** Controlled expanded state — when provided, component is controlled */
  expanded?: boolean;
  /** Called when the trigger is clicked (required for controlled mode) */
  onToggle?: () => void;
  /** Whether the trigger click is disabled (e.g. during editing) @default false */
  toggleDisabled?: boolean;
  /** Default expanded state for uncontrolled mode @default false */
  defaultExpanded?: boolean;
}

/** Reusable accordion with chevron toggle, header actions, and collapsible content panel. */
export const Accordion: React.FC<AccordionProps> = ({
  trigger,
  actions,
  children,
  expanded: controlledExpanded,
  onToggle,
  toggleDisabled = false,
  defaultExpanded = false,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = useCallback(() => {
    if (toggleDisabled) {
      return;
    }

    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  }, [toggleDisabled, isControlled, onToggle]);

  return (
    <div className="rounded-md border border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
          aria-expanded={isExpanded}
          disabled={toggleDisabled}
        >
          <Icon
            name={isExpanded ? Icons.CHEVRONDOWN : Icons.CHEVRONRIGHT}
            styleProps={{ size: 'sm', colour: 'currentColor' }}
          />
          {trigger}
        </button>

        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>

      {/* Collapsible content */}
      {isExpanded && <div className="border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
};
