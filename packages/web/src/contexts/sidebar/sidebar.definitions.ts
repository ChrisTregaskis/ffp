import { createContext } from 'react';

export interface SidebarContextType {
  // Whether the sidebar is currently collapsed
  isCollapsed: boolean;
  // Toggle the sidebar collapsed state
  toggleCollapsed: () => void;
  // Set the sidebar collapsed state explicitly
  setIsCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType | null>(null);
