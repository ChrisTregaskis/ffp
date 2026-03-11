import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

import { ErrorBoundary } from '@web/components/error';
import { ToastProvider } from '@web/contexts/toast/ToastContext';
import { queryClient } from '@web/lib/query';
import { Router } from '@web/pages/routes/Router';

/**
 * Main application component.
 *
 * Renders the application router which handles all routing logic,
 * including public/protected route separation and authentication checks.
 *
 * Authentication is provided by AuthProvider in main.tsx.
 * Route-level errors are caught by ErrorBoundary to prevent full app crashes.
 * TanStack Query provides data fetching, caching, and state management.
 */
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </ErrorBoundary>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;
