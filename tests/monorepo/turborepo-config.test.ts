import { readFileSync } from 'fs';
import { resolve } from 'path';

import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Pins the Turborepo task order: without it, tasks run against stale builds and nothing fails
 */

describe('Turborepo Configuration', () => {
  const rootDir = resolve(__dirname, '../..');

  describe('Task Dependencies', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('build should depend on ^build (topological)', () => {
      expect(turboConfig.tasks.build.dependsOn).toContain('^build');
    });

    it('test should depend on build', () => {
      expect(turboConfig.tasks.test.dependsOn).toContain('build');
    });

    it('typecheck should depend on ^build', () => {
      expect(turboConfig.tasks.typecheck.dependsOn).toContain('^build');
    });
  });
});
