import React from 'react';

import { SidebarProvider } from '@web/contexts/sidebar/SidebarContext';

import { AppLayoutContent } from './AppLayoutContent';

import type { PropsWithChildren } from 'react';

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
