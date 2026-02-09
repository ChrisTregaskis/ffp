import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IconButton } from '@web/components/button';
import { Logo } from '@web/components/logo';
import { SlideWidth, ClickScale } from '@web/components/motion';
import { Text } from '@web/components/text';
import { getNavigationItems } from '@web/config/navigation';
import type { NavItem as NavItemType } from '@web/config/navigation';
import { useAuth } from '@web/hooks/useAuth';
import { useSidebar } from '@web/hooks/useSidebar';
import { RouteKey, routes } from '@web/pages/routes';

import { NavItem } from './NavItem';

const SIDEBAR_EXPANDED_WIDTH = 256; // 64 * 4 = 256px (w-64)
const SIDEBAR_COLLAPSED_WIDTH = 80; // 20 * 4 = 80px (w-20)

interface SideMenuProps {
  handleLogout: () => void;
}

/**
 * Desktop sidebar navigation menu with collapsible functionality
 * Shouldn't be used on mobile view
 */
export const SideMenu: React.FC<SideMenuProps> = ({ handleLogout }) => {
  const { user } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Get navigation items for the current user role
  const navItems: NavItemType[] = user ? getNavigationItems(user.role, handleLogout) : [];

  const mainNavItems = navItems.filter((item) => item.section === 'main');
  const footerNavItems = navItems.filter((item) => item.section === 'footer');

  return (
    <SlideWidth
      isCollapsed={isCollapsed}
      expandedWidth={SIDEBAR_EXPANDED_WIDTH}
      collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
      duration={0.15}
      easing="easeInOut"
      className="fixed left-0 top-0 z-40 hidden h-screen border-r border-white bg-ffp-navy shadow-md lg:flex lg:flex-col"
    >
      {/* Header Section */}
      <div
        className="flex items-center justify-between border-b border-white p-6"
        onMouseEnter={() => {
          setIsHeaderHovered(true);
        }}
        onMouseLeave={() => {
          setIsHeaderHovered(false);
        }}
      >
        {/* Logo and App Name */}
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => {
            void navigate(routes[RouteKey.HOME].path);
          }}
          role="button"
          tabIndex={0}
          aria-label="Go to home"
        >
          <Logo variant="white" size="sm" />
          {!isCollapsed && (
            <Text styleProps={{ size: 'lg', weight: 'semibold', colour: 'white' }}>
              Fit For Purpose
            </Text>
          )}
        </div>

        {/* Collapse Toggle Button */}
        {!isCollapsed && (
          <div
            className={`flex items-center transition-opacity ${isHeaderHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <IconButton
              icon="LeftPanelClose"
              size="lg"
              colour="#fff"
              onClick={toggleCollapsed}
              ariaLabel="Collapse sidebar"
              className="p-2"
            />
          </div>
        )}
      </div>

      {/* Expand Button (shown when collapsed) */}
      {isCollapsed && (
        <div className="inline-flex items-center justify-center transition-opacity hover:opacity-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-full hover:bg-muted border-white">
          <ClickScale scale={0.95} duration={0.1}>
            <IconButton
              icon="LeftPanelOpen"
              size="md"
              colour="#fff"
              onClick={toggleCollapsed}
              ariaLabel="Expand sidebar"
              className="py-3 "
            />
          </ClickScale>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 w-full justify-center overflow-y-auto">
        <div className="flex-col w-full space-y-1 justify-center ">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              path={item.path}
              isCollapsed={isCollapsed}
              onClick={item.onClick}
            />
          ))}
        </div>
      </nav>

      {/* Footer Navigation */}
      <div className="py-4">
        <div className="space-y-1">
          {footerNavItems.map((item) => (
            <NavItem
              key={item.key}
              label={item.label}
              icon={item.icon}
              path={item.path}
              isCollapsed={isCollapsed}
              onClick={item.onClick}
            />
          ))}
        </div>
      </div>
    </SlideWidth>
  );
};
