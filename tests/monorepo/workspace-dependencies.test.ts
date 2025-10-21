import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Tests to verify workspace dependencies work correctly
 *
 * FFP-23: Monorepo Setup Tests
 * Validates that @ffp/* workspace imports function properly
 */

describe('Workspace Dependencies', () => {
  const rootDir = resolve(__dirname, '../..');
  const packagesDir = resolve(rootDir, 'packages');

  describe('Package Structure', () => {
    it('should have all required packages', () => {
      const requiredPackages = ['core', 'web', 'functions', 'eslint-config', 'prettier-config'];

      requiredPackages.forEach((pkg) => {
        const pkgPath = resolve(packagesDir, pkg);
        expect(existsSync(pkgPath), `Package ${pkg} should exist`).toBe(true);
      });
    });

    it('should have package.json in each package', () => {
      const packages = ['core', 'web', 'functions'];

      packages.forEach((pkg) => {
        const packageJsonPath = resolve(packagesDir, pkg, 'package.json');
        expect(existsSync(packageJsonPath), `${pkg}/package.json should exist`).toBe(true);
      });
    });
  });

  describe('Workspace Protocol', () => {
    it('web package should depend on @ffp/core using workspace protocol', () => {
      const webPackageJson = require('../../packages/web/package.json');

      expect(webPackageJson.dependencies).toHaveProperty('@ffp/core');
      expect(webPackageJson.dependencies['@ffp/core']).toBe('workspace:*');
    });

    it('functions package should depend on @ffp/core using workspace protocol', () => {
      const functionsPackageJson = require('../../packages/functions/package.json');

      expect(functionsPackageJson.dependencies).toHaveProperty('@ffp/core');
      expect(functionsPackageJson.dependencies['@ffp/core']).toBe('workspace:*');
    });

    it('packages should use shared config packages', () => {
      const webPackageJson = require('../../packages/web/package.json');
      const corePackageJson = require('../../packages/core/package.json');

      expect(webPackageJson.devDependencies).toHaveProperty('@ffp/eslint-config');
      expect(corePackageJson.devDependencies).toHaveProperty('@ffp/eslint-config');

      expect(webPackageJson.devDependencies['@ffp/eslint-config']).toBe('workspace:*');
      expect(corePackageJson.devDependencies['@ffp/eslint-config']).toBe('workspace:*');
    });
  });

  describe('Build Verification', () => {
    it('should have built core package', () => {
      const coreDistPath = resolve(packagesDir, 'core', 'dist');

      expect(
        existsSync(coreDistPath),
        'Core package dist/ directory should exist (run pnpm build if missing)'
      ).toBe(true);
    });

    it('should have TypeScript declaration files for core', () => {
      const coreIndexDts = resolve(packagesDir, 'core', 'dist', 'index.d.ts');

      expect(
        existsSync(coreIndexDts),
        'Core package should have index.d.ts (run pnpm build if missing)'
      ).toBe(true);
    });

    // TODO: Bring back in at a later point
    // it('should be able to import from @ffp/core', async () => {
    //   // Dynamic import to avoid build-time resolution
    //   const { APP_NAME } = await import('@ffp/core');

    //   expect(APP_NAME).toBeDefined();
    //   expect(typeof APP_NAME).toBe('string');
    //   expect(APP_NAME).toBe('Fit For Purpose');
    // });
  });

  describe('pnpm Workspace Configuration', () => {
    it('should have pnpm-workspace.yaml', () => {
      const workspaceYaml = resolve(rootDir, 'pnpm-workspace.yaml');
      expect(existsSync(workspaceYaml)).toBe(true);
    });

    it('should include packages in workspace', () => {
      const workspaceYaml = require('fs').readFileSync(
        resolve(rootDir, 'pnpm-workspace.yaml'),
        'utf-8'
      );

      expect(workspaceYaml).toContain('packages/*');
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve workspace dependencies correctly', () => {
      try {
        // Check if pnpm correctly linked workspace packages
        execSync('pnpm list @ffp/core --depth=0', {
          cwd: resolve(packagesDir, 'web'),
          stdio: 'pipe',
        });
      } catch (error) {
        // If this throws, workspace dependencies aren't resolved
        throw new Error(
          `Workspace dependency @ffp/core not resolved in web package. Run: pnpm install`
        );
      }
    });
  });
});
