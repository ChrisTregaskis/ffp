import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type PropsWithChildren,
} from 'react';

const STORAGE_KEY = 'ffp-sidebar-collapsed';

export interface SidebarContextType {
  // Whether the sidebar is currently collapsed
  isCollapsed: boolean;
  // Toggle the sidebar collapsed state
  toggleCollapsed: () => void;
  // Set the sidebar collapsed state explicitly
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Sidebar context provider
 * Manages the collapsed state of the sidebar and persists to localStorage
 */
export const SidebarProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapsed = (): void => {
    setIsCollapsed((prev) => !prev);
  };

  const value: SidebarContextType = {
    isCollapsed,
    toggleCollapsed,
    setIsCollapsed,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

/**
 * Hook to access sidebar context
 * @throws Error if used outside SidebarProvider
 * TODO: Move to hook file to avoid eslint issues
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);

  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }

  return context;
};
