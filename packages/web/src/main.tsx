import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Import Inter font weights
import '@fontsource/inter/400.css'; // Regular
import '@fontsource/inter/500.css'; // Medium
import '@fontsource/inter/600.css'; // Semibold
import '@fontsource/inter/700.css'; // Bold

// Initialise AWS Amplify authentication
import './lib/auth';

import { AuthProvider } from '@web/contexts/AuthContext';

import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
