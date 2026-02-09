import React, { useState, useEffect, type PropsWithChildren } from 'react';

import { SidebarContext, type SidebarContextType } from './sidebar.definitions';

const STORAGE_KEY = 'ffp-sidebar-collapsed';

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
