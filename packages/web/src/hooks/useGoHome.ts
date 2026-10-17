import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { RouteKey, routes } from '@web/config/routes';
import { useAuth } from '@web/hooks/useAuth';
import { getRoleHomePath } from '@web/lib/rbac';

/** Navigates to the signed-in user's home page for their role, or to sign-in without a user. */
export const useGoHome = (): (() => void) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return useCallback(() => {
    if (!user) {
      void navigate(routes[RouteKey.LOGIN].path);

      return;
    }

    void navigate(routes[getRoleHomePath(user.role)].path);
  }, [navigate, user]);
};
