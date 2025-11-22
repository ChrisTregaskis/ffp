import { AnimatePresence } from 'motion/react';
import { useState, type PropsWithChildren } from 'react';

import { ScaleFade } from '../motion';

export interface TooltipProps extends PropsWithChildren {
  // Content to display in the tooltip
  content: string;
  // Whether the tooltip is visible
  isVisible: boolean;
  // Position of the tooltip relative to the trigger element
  position?: 'top' | 'right' | 'bottom' | 'left';
  // Additional CSS classes
  className?: string;
}

/**
 * Tooltip component that displays contextual information on hover
 * Primarily used for collapsed sidebar navigation items
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  isVisible,
  position = 'right',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const showTooltip = isVisible && isHovered;

  // Position classes based on tooltip position
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  // Arrow position classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent border-t-foreground',
    right:
      'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent border-r-foreground',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent border-b-foreground',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent border-l-foreground',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      {children}

      <AnimatePresence>
        {showTooltip && (
          <ScaleFade
            className={`
              absolute z-50 whitespace-nowrap
              rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background
              shadow-lg
              ${positionClasses[position]}
              ${className}
            `}
          >
            <div role="tooltip">
              {content}

              {/* Arrow pointer */}
              <div
                className={`
                  absolute h-0 w-0
                  border-4
                  ${arrowClasses[position]}
                `}
              />
            </div>
          </ScaleFade>
        )}
      </AnimatePresence>
    </div>
  );
};
