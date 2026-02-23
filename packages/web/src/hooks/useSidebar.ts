import { useContext } from 'react';

import { SidebarContext, type SidebarContextType } from '@web/contexts/sidebar/sidebar.definitions';

/**
 * Hook to access sidebar context
 * @throws Error if used outside SidebarProvider
 */
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
};
