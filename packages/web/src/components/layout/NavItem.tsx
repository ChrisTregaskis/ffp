import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Icon } from '@web/components/Icon';
import type { IconName } from '@web/components/Icon/types';
import { ClickScale } from '@web/components/motion';
import { Text } from '@web/components/text';

export interface NavItemProps {
  // Display label for the navigation item
  label: string;
  // Icomoon icon name
  icon: IconName;
  // URL path to navigate to
  path: string;
  // Whether the sidebar is collapsed (shows only icon with tooltip)
  isCollapsed: boolean;
  // Optional click handler (for actions like logout)
  onClick?: () => void;
  // Additional CSS classes
  className?: string;
}

/**
 * Navigation item component for sidebar menu
 * Supports both link-based navigation and click handlers (for logout)
 * Shows tooltip when sidebar is collapsed
 */
export const NavItem: React.FC<NavItemProps> = ({
  label,
  icon,
  path,
  isCollapsed,
  onClick,
  className = '',
}) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  // Common styling classes
  const baseClasses = `
    flex w-full items-center gap-3 py-3
    transition-colors duration-150 text-white
    ${isActive ? 'bg-primary' : 'hover:bg-secondary'}
    ${isCollapsed ? 'justify-center' : 'px-4'}
    ${className}
  `;

  // Icon component (always visible)
  const iconElement = (
    <Icon name={icon} styleProps={{ size: 'md', colour: 'currentColor' }} ariaLabel={label} />
  );

  // Label text (hidden when collapsed)
  const labelElement = !isCollapsed && (
    <Text
      styleProps={{
        size: 'sm',
        weight: 'medium',
        colour: 'white',
      }}
    >
      {label}
    </Text>
  );

  // Content wrapper with tooltip support
  const content = (
    <div className="flex items-center gap-3">
      {iconElement}
      {labelElement}
    </div>
  );

  // If onClick handler is provided, render as button
  if (onClick) {
    return (
      <ClickScale scale={0.97} duration={0.1}>
        {/* This is a custom button for navigation only, so not utilising Button.tsx */}
        <button onClick={onClick} className={`w-full ${baseClasses}`} aria-label={label}>
          {content}
        </button>
      </ClickScale>
    );
  }

  // Otherwise, render as Link
  return (
    <ClickScale scale={0.97} duration={0.1}>
      <Link to={path} className={baseClasses} aria-current={isActive ? 'page' : undefined}>
        {content}
      </Link>
    </ClickScale>
  );
};
