import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import stripJsonComments from 'strip-json-comments';
import { describe, it, expect } from 'vitest';

/**
 * Tests to verify ESLint and Prettier configurations
 *
 * FFP-23: Monorepo Setup Tests
 * Validates shared linting and formatting configs
 */

describe('Code Quality Tools', () => {
  const rootDir = resolve(__dirname, '../..');
  const packagesDir = resolve(rootDir, 'packages');

  describe('ESLint Configuration', () => {
    it('should have root .eslintrc.js', () => {
      const eslintrc = resolve(rootDir, '.eslintrc.js');
      expect(existsSync(eslintrc)).toBe(true);
    });

    it('should have shared eslint-config package', () => {
      const configPath = resolve(packagesDir, 'eslint-config');
      expect(existsSync(configPath)).toBe(true);
    });

    it('eslint-config should export configurations', () => {
      const baseConfig = resolve(packagesDir, 'eslint-config', 'base.js');
      const reactConfig = resolve(packagesDir, 'eslint-config', 'react.js');
      const nodeConfig = resolve(packagesDir, 'eslint-config', 'node.js');

      expect(existsSync(baseConfig)).toBe(true);
      expect(existsSync(reactConfig)).toBe(true);
      expect(existsSync(nodeConfig)).toBe(true);
    });

    it('packages should have .eslintrc.cjs files', () => {
      const packages = ['core', 'web', 'functions'];

      packages.forEach((pkg) => {
        const eslintrc = resolve(packagesDir, pkg, '.eslintrc.cjs');
        expect(existsSync(eslintrc), `${pkg} should have .eslintrc.cjs`).toBe(true);
      });
    });

    it('web package should extend react config', () => {
      const eslintrc = resolve(packagesDir, 'web', '.eslintrc.cjs');
      const content = readFileSync(eslintrc, 'utf-8');

      expect(content).toContain('@ffp/eslint-config/react');
    });

    it('core package should extend node config', () => {
      const eslintrc = resolve(packagesDir, 'core', '.eslintrc.cjs');
      const content = readFileSync(eslintrc, 'utf-8');

      expect(content).toContain('@ffp/eslint-config/node');
    });

    it('should have .eslintignore', () => {
      const eslintignore = resolve(rootDir, '.eslintignore');
      expect(existsSync(eslintignore)).toBe(true);
    });
  });

  describe('Prettier Configuration', () => {
    it('should have root .prettierrc.js', () => {
      const prettierrc = resolve(rootDir, '.prettierrc.js');
      expect(existsSync(prettierrc)).toBe(true);
    });

    it('should have shared prettier-config package', () => {
      const configPath = resolve(packagesDir, 'prettier-config');
      expect(existsSync(configPath)).toBe(true);
    });

    it('prettier-config should export configuration', () => {
      const indexJs = resolve(packagesDir, 'prettier-config', 'index.js');
      expect(existsSync(indexJs)).toBe(true);
    });

    it('should have .prettierignore', () => {
      const prettierignore = resolve(rootDir, '.prettierignore');
      expect(existsSync(prettierignore)).toBe(true);
    });

    it('root .prettierrc should use shared config', () => {
      const prettierrc = readFileSync(resolve(rootDir, '.prettierrc.js'), 'utf-8');
      expect(prettierrc).toContain('@ffp/prettier-config');
    });
  });

  describe('Linting Rules', () => {
    it('should enforce 2 spaces indentation', () => {
      const prettierConfig = require('../../packages/prettier-config/index.js');
      expect(prettierConfig.tabWidth).toBe(2);
      expect(prettierConfig.useTabs).toBe(false);
    });

    it('should enforce 100 character line length', () => {
      const prettierConfig = require('../../packages/prettier-config/index.js');
      expect(prettierConfig.printWidth).toBe(100);
    });

    it('should use single quotes', () => {
      const prettierConfig = require('../../packages/prettier-config/index.js');
      expect(prettierConfig.singleQuote).toBe(true);
    });

    it('should require semicolons', () => {
      const prettierConfig = require('../../packages/prettier-config/index.js');
      expect(prettierConfig.semi).toBe(true);
    });

    it('should use LF line endings', () => {
      const prettierConfig = require('../../packages/prettier-config/index.js');
      expect(prettierConfig.endOfLine).toBe('lf');
    });
  });

  describe('Lint Execution', () => {
    it('should have lint script in root package.json', () => {
      const pkg = require('../../package.json');
      expect(pkg.scripts.lint).toBeDefined();
      expect(pkg.scripts['lint:fix']).toBeDefined();
    });

    it('should have lint scripts in packages', () => {
      const packages = ['core', 'web', 'functions'];

      packages.forEach((pkgName) => {
        const pkg = require(`../../packages/${pkgName}/package.json`);
        expect(pkg.scripts.lint, `${pkgName} should have lint script`).toBeDefined();
      });
    });

    it('should successfully lint root files', () => {
      try {
        execSync('pnpm run lint:root', {
          cwd: rootDir,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
        // If no error thrown, linting passed
        expect(true).toBe(true);
      } catch (error: any) {
        // Check if it's a linting error (exit code 1) vs other error
        if (error.status === 1) {
          throw new Error(`Linting failed with errors: ${error.stdout || error.stderr}`);
        }
        throw error;
      }
    });
  });

  describe('Import Organization', () => {
    it('eslint-config should enforce import order', () => {
      const baseConfig = require('../../packages/eslint-config/base.js');

      expect(baseConfig.rules['import/order']).toBeDefined();
    });

    it('should group external, internal, and relative imports', () => {
      const baseConfig = require('../../packages/eslint-config/base.js');
      const importOrderRule = baseConfig.rules['import/order'][1];

      expect(importOrderRule.groups).toContain('builtin');
      expect(importOrderRule.groups).toContain('external');
      expect(importOrderRule.groups).toContain('internal');
    });

    it('should configure path groups for @ffp/* imports', () => {
      const baseConfig = require('../../packages/eslint-config/base.js');
      const importOrderRule = baseConfig.rules['import/order'][1];

      const ffpPathGroup = importOrderRule.pathGroups?.find(
        (group: any) => group.pattern === '@ffp/**'
      );

      expect(ffpPathGroup).toBeDefined();
      expect(ffpPathGroup.group).toBe('external');
    });
  });

  describe('VS Code Integration', () => {
    it('should have VS Code settings', () => {
      const vscodeSettings = resolve(rootDir, '.vscode', 'settings.json');
      expect(existsSync(vscodeSettings)).toBe(true);
    });

    it('should enable ESLint auto-fix on save', () => {
      const rawContent = readFileSync(resolve(rootDir, '.vscode', 'settings.json'), 'utf-8');
      const vscodeSettings = JSON.parse(stripJsonComments(rawContent));

      expect(vscodeSettings['editor.codeActionsOnSave']).toBeDefined();
      expect(vscodeSettings['editor.codeActionsOnSave']['source.fixAll.eslint']).toBe('explicit');
    });
  });
});
