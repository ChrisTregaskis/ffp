import { useContext } from 'react';

import { AuthContext, type AuthContextType } from '@web/contexts/auth/auth.definitions';

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider component.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
