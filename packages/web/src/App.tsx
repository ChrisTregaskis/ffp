import { ErrorBoundary } from '@web/components/error';
import { Router } from '@web/pages/routes/Router';

/**
 * Main application component.
 *
 * Renders the application router which handles all routing logic,
 * including public/protected route separation and authentication checks.
 *
 * Authentication is provided by AuthProvider in main.tsx.
 * Route-level errors are caught by ErrorBoundary to prevent full app crashes.
 */
function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

export default App;
