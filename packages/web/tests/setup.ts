import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Test setup for @ffp/web package
 *
 * Configures testing library and cleanup
 */

// Cleanup after each test
afterEach(() => {
  cleanup();
});
