import { motion } from 'motion/react';

import type { ReactNode } from 'react';

export interface CollapsibleSidebarProps {
  /** Whether the sidebar is open */
  isOpen: boolean;
  /** Width in pixels when open */
  width?: number;
  /** Sidebar content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated collapsible sidebar panel for session exercise list.
 *
 * Animates width and opacity on open/close. Renders as semantic aside.
 * Desktop only (lg:) — hidden on smaller viewports.
 */
export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  width = 260,
  children,
  className = '',
}) => (
  <motion.aside
    initial={false}
    animate={{
      width: isOpen ? width : 0,
      opacity: isOpen ? 1 : 0,
    }}
    transition={{ duration: 0.2, ease: 'easeInOut' }}
    className={`hidden shrink-0 overflow-hidden border-r border-border lg:block ${className}`.trim()}
  >
    <div style={{ width }} className="overflow-y-auto">
      {children}
    </div>
  </motion.aside>
);
