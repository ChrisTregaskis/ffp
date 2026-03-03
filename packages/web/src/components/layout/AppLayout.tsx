import { useNavigate } from 'react-router-dom';

import { getNavigationItems } from '@web/config/navigation';
import { SidebarProvider } from '@web/contexts/sidebar/SidebarContext';
import { useAuth } from '@web/hooks/useAuth';
import { useSidebar } from '@web/hooks/useSidebar';
import { createLogger } from '@web/lib/logger';
import { RouteKey, routes } from '@web/pages/routes';

import { MobileMenu } from './MobileMenu';
import { SideMenu } from './SideMenu';

import type { MobileMenuNavItem } from './MobileMenu';
import type { PropsWithChildren } from 'react';

const logger = createLogger('AppLayoutContent');

/**
 * Internal layout component that uses sidebar context
 * Separated to allow proper context consumption
 */
const AppLayoutContent: React.FC<PropsWithChildren> = ({ children }) => {
  const { isCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Hanlder for triggering logout. Asyncronous but we don't need wait for it to finish.
  const triggerLogout = (): void => {
    logout()
      .then(() => {
        void navigate(routes[RouteKey.LOGIN].path);
      })
      .catch((error: unknown) => {
        logger.error('Failure to logout or navigate', {
          error: error && typeof error === 'object' ? error : String(error),
        });
      });
  };

  // Get navigation items for mobile menu
  const navItems: MobileMenuNavItem[] = user
    ? getNavigationItems(user.role, triggerLogout).map((item) => ({
        key: item.key,
        label: item.label,
        icon: item.icon,
        path: item.path,
        section: item.section,
        onClick: item.onClick,
      }))
    : [];

  // Calculate main content margin based on sidebar state
  const mainContentMargin = isCollapsed ? 'lg:ml-20' : 'lg:ml-[230px]';

  return (
    <div className="min-h-screen bg-muted lg:flex">
      {/* Desktop Sidebar Navigation */}
      <SideMenu handleLogout={triggerLogout} />

      {/* Mobile Hamburger Menu for smaller screens */}
      <MobileMenu navItems={navItems} />

      {/* Main content area - adjusts margin based on sidebar state */}
      <main className={`flex-1 transition-all duration-300 ${mainContentMargin}`}>{children}</main>
    </div>
  );
};

/**
 * Main application layout wrapper for protected routes.
 */
export const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
};
