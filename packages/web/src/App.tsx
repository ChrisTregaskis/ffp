import { Router } from '@web/pages/routes/Router';

/**
 * Main application component.
 *
 * Renders the application router which handles all routing logic,
 * including public/protected route separation and authentication checks.
 *
 * Authentication is provided by AuthProvider in main.tsx.
 */
function App(): JSX.Element {
  return <Router />;
}

export default App;
