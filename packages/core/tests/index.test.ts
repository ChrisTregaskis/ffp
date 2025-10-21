/**
 * Basic smoke tests for @ffp/core package
 */
import { describe, it, expect } from 'vitest';

describe('@ffp/core package', () => {
  it('should be importable', async () => {
    // Test that the package can be imported without errors
    const coreModule = await import('../src/index');
    expect(coreModule).toBeDefined();
  });

  it('should export expected modules', async () => {
    const coreModule = await import('../src/index');

    // Add specific exports as they are implemented
    expect(typeof coreModule).toBe('object');
  });
});
