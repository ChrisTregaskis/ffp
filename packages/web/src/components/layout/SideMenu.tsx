import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { Icons } from '@web/components/Icon/types';
import { Logo } from '@web/components/logo';
import { SlideWidth, ClickScale } from '@web/components/motion';
import { Text } from '@web/components/text';
import { getContextNavItems, getNavigationItems } from '@web/config/navigation';
import type { NavItem as NavItemType } from '@web/config/navigation';
import { useAuth } from '@web/hooks/useAuth';
import { useSidebar } from '@web/hooks/useSidebar';
import { RouteKey, routes } from '@web/pages/routes';

import { NavItem } from './NavItem';

const SIDEBAR_EXPANDED_WIDTH = 230;
const SIDEBAR_COLLAPSED_WIDTH = 80; // 20 * 4 = 80px (w-20)

interface SideMenuProps {
  handleLogout: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ handleLogout }) => {
  const { user } = useAuth();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current route has context-specific navigation
  const contextNavItems = getContextNavItems(location.pathname);

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
      <div className="flex items-center border-b border-white p-6">
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
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 w-full justify-center overflow-y-auto">
        <div className="flex w-full flex-col space-y-1">
          {contextNavItems
            ? contextNavItems.map((item) => (
                <NavItem
                  key={item.path}
                  label={item.label}
                  icon={item.icon}
                  path={item.path}
                  isCollapsed={isCollapsed}
                />
              ))
            : mainNavItems.map((item) => (
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
          {/* Collapse/Expand Toggle */}
          <ClickScale scale={0.97} duration={0.1}>
            <Button
              variant="ghost"
              onClick={toggleCollapsed}
              icon={
                <Icon
                  name={isCollapsed ? Icons.LEFTPANELOPEN : Icons.LEFTPANELCLOSE}
                  styleProps={{ size: 'md', colour: 'currentColor' }}
                />
              }
              className={`w-full text-white hover:bg-secondary ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              {!isCollapsed && (
                <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'white' }}>Collapse</Text>
              )}
            </Button>
          </ClickScale>

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
