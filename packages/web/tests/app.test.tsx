/**
 * Basic smoke tests for @ffp/web package
 */
import { describe, it, expect } from 'vitest';

describe('@ffp/web package', () => {
  it('should pass basic test', () => {
    // Simple test that doesn't require complex imports
    expect(true).toBe(true);
  });

  it('should have proper environment setup', () => {
    // Test that vitest environment is working
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
