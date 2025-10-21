import { existsSync, readdirSync, statSync } from 'fs';
import { resolve } from 'path';

import { describe, it, expect } from 'vitest';

/**
 * Tests to verify build outputs are generated correctly
 *
 * FFP-23: Monorepo Setup Tests
 * Validates that Turborepo builds produce expected outputs
 */

describe('Build Outputs', () => {
  const rootDir = resolve(__dirname, '../..');
  const packagesDir = resolve(rootDir, 'packages');

  describe('Core Package Build', () => {
    it('should have dist directory after build', () => {
      const distPath = resolve(packagesDir, 'core', 'dist');

      expect(existsSync(distPath), 'Core dist/ directory should exist. Run: pnpm build').toBe(true);
    });

    it('should have index.js in dist', () => {
      const indexJs = resolve(packagesDir, 'core', 'dist', 'index.js');

      expect(existsSync(indexJs), 'Core index.js should be built. Run: pnpm build').toBe(true);
    });

    it('should have TypeScript declaration files', () => {
      const indexDts = resolve(packagesDir, 'core', 'dist', 'index.d.ts');

      expect(existsSync(indexDts), 'Core index.d.ts should be generated. Run: pnpm build').toBe(
        true
      );
    });

    it('should have declaration map files', () => {
      const indexDtsMap = resolve(packagesDir, 'core', 'dist', 'index.d.ts.map');

      expect(existsSync(indexDtsMap), 'Core declaration maps should be generated').toBe(true);
    });

    it('should export constants module', () => {
      const constPath = resolve(packagesDir, 'core', 'dist', 'lib');

      if (existsSync(constPath)) {
        const files = readdirSync(constPath);
        expect(files.some((f) => f.includes('constants'))).toBe(true);
      }
    });
  });

  describe('Functions Package Build', () => {
    it('should have dist directory after build', () => {
      const distPath = resolve(packagesDir, 'functions', 'dist');

      expect(existsSync(distPath), 'Functions dist/ directory should exist. Run: pnpm build').toBe(
        true
      );
    });

    it('should preserve directory structure in dist', () => {
      const authPath = resolve(packagesDir, 'functions', 'dist', 'auth');

      expect(
        existsSync(authPath),
        'Functions dist should preserve src/ structure. Run: pnpm build'
      ).toBe(true);
    });
  });

  describe('Output File Permissions', () => {
    it('built JavaScript files should be readable', () => {
      const indexJs = resolve(packagesDir, 'core', 'dist', 'index.js');

      if (existsSync(indexJs)) {
        const stats = statSync(indexJs);
        // Check if file is readable (any read permission)
        expect(stats.mode & 0o444).toBeGreaterThan(0);
      }
    });
  });

  describe('Build Artifacts', () => {
    it('should exclude test files from build', () => {
      const distPath = resolve(packagesDir, 'core', 'dist');

      if (existsSync(distPath)) {
        const findTestFiles = (dir: string): string[] => {
          const results: string[] = [];
          const entries = readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = resolve(dir, entry.name);
            if (entry.isDirectory()) {
              results.push(...findTestFiles(fullPath));
            } else if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
              results.push(fullPath);
            }
          }
          return results;
        };

        const testFiles = findTestFiles(distPath);
        expect(testFiles.length).toBe(0);
      }
    });

    it('should exclude markdown files from build', () => {
      const distPath = resolve(packagesDir, 'core', 'dist');

      if (existsSync(distPath)) {
        const findMdFiles = (dir: string): string[] => {
          const results: string[] = [];
          const entries = readdirSync(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = resolve(dir, entry.name);
            if (entry.isDirectory()) {
              results.push(...findMdFiles(fullPath));
            } else if (entry.name.endsWith('.md')) {
              results.push(fullPath);
            }
          }
          return results;
        };

        const mdFiles = findMdFiles(distPath);
        expect(mdFiles.length).toBe(0);
      }
    });
  });

  describe('Package Exports', () => {
    it('core package should export main and types', () => {
      const pkg = require('../../packages/core/package.json');

      expect(pkg.main).toBe('./dist/index.js');
      expect(pkg.types).toBe('./dist/index.d.ts');
    });

    it('core package should have exports field', () => {
      const pkg = require('../../packages/core/package.json');

      expect(pkg.exports).toBeDefined();
      expect(pkg.exports['.']).toBeDefined();
      expect(pkg.exports['.'].import).toBe('./dist/index.js');
      expect(pkg.exports['.'].types).toBe('./dist/index.d.ts');
    });
  });

  describe('Clean Build State', () => {
    it('should not have node_modules in dist', () => {
      const distNodeModules = resolve(packagesDir, 'core', 'dist', 'node_modules');

      expect(existsSync(distNodeModules)).toBe(false);
    });

    it('should only have turbo logs in .turbo directory (no cache artifacts)', () => {
      const turboCache = resolve(packagesDir, 'core', '.turbo');

      if (existsSync(turboCache)) {
        const files = readdirSync(turboCache);

        // Turborepo creates log files in .turbo directories, which is expected
        // We just want to ensure there are no cache artifacts
        const nonLogFiles = files.filter((f) => !f.endsWith('.log'));

        expect(
          nonLogFiles.length,
          'Should only have .log files in .turbo directory, no cache artifacts'
        ).toBe(0);
      } else {
        // If .turbo doesn't exist, that's also fine (clean state)
        expect(true).toBe(true);
      }
    });
  });
});
