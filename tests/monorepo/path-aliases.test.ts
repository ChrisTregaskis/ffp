import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import stripJsonComments from 'strip-json-comments';
import { describe, it, expect } from 'vitest';

/**
 * Tests to verify TypeScript path aliases are configured correctly
 *
 * FFP-23: Monorepo Setup Tests
 * Validates path alias configuration in tsconfig files
 */

/**
 * Helper function to parse JSONC (JSON with Comments) files
 */
function parseJsonc(filePath: string): any {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(stripJsonComments(content));
}

describe('TypeScript Path Aliases', () => {
  const rootDir = resolve(__dirname, '../..');
  const packagesDir = resolve(rootDir, 'packages');

  describe('Base Configuration', () => {
    it('should have tsconfig.base.json at root', () => {
      const tsconfigBase = resolve(rootDir, 'tsconfig.base.json');
      expect(existsSync(tsconfigBase)).toBe(true);
    });

    it('should define @ffp/* path aliases in base config', () => {
      const tsconfigBase = parseJsonc(resolve(rootDir, 'tsconfig.base.json'));

      expect(tsconfigBase.compilerOptions.paths).toBeDefined();
      expect(tsconfigBase.compilerOptions.paths['@ffp/core']).toBeDefined();
    });

    it('should have strict mode enabled', () => {
      const tsconfigBase = parseJsonc(resolve(rootDir, 'tsconfig.base.json'));

      expect(tsconfigBase.compilerOptions.strict).toBe(true);
      expect(tsconfigBase.compilerOptions.noUnusedLocals).toBe(true);
      expect(tsconfigBase.compilerOptions.noUnusedParameters).toBe(true);
    });
  });

  describe('Package-specific TypeScript Configs', () => {
    it('core package should have tsconfig.json', () => {
      const tsconfig = resolve(packagesDir, 'core', 'tsconfig.json');
      expect(existsSync(tsconfig)).toBe(true);
    });

    it('core package should extend base config', () => {
      const tsconfig = parseJsonc(resolve(packagesDir, 'core', 'tsconfig.json'));

      expect(tsconfig.extends).toBe('../../tsconfig.base.json');
    });

    it('core package should define @core/* aliases', () => {
      const tsconfig = parseJsonc(resolve(packagesDir, 'core', 'tsconfig.json'));

      const paths = tsconfig.compilerOptions?.paths || {};
      expect(paths['@core/lib/*']).toBeDefined();
      expect(paths['@core/schemas/*']).toBeDefined();
      expect(paths['@core/services/*']).toBeDefined();
      expect(paths['@core/repositories/*']).toBeDefined();
    });

    it('functions package should define @functions/* aliases', () => {
      const tsconfig = parseJsonc(resolve(packagesDir, 'functions', 'tsconfig.json'));

      const paths = tsconfig.compilerOptions?.paths || {};
      expect(paths['@functions/auth/*']).toBeDefined();
      expect(paths['@functions/assessments/*']).toBeDefined();
    });

    it('web package should have dual tsconfig setup', () => {
      const tsconfigApp = resolve(packagesDir, 'web', 'tsconfig.json');
      const tsconfigNode = resolve(packagesDir, 'web', 'tsconfig.node.json');

      expect(existsSync(tsconfigApp)).toBe(true);
      expect(existsSync(tsconfigNode)).toBe(true);
    });

    it('web package should define @web/* aliases', () => {
      const tsconfig = parseJsonc(resolve(packagesDir, 'web', 'tsconfig.json'));

      const paths = tsconfig.compilerOptions?.paths || {};
      expect(paths['@web/components/*']).toBeDefined();
      expect(paths['@web/hooks/*']).toBeDefined();
      expect(paths['@web/pages/*']).toBeDefined();
    });

    it('web package should have project references to core', () => {
      const tsconfig = parseJsonc(resolve(packagesDir, 'web', 'tsconfig.json'));

      expect(tsconfig.references).toBeDefined();
      expect(tsconfig.references).toContainEqual({ path: '../core' });
    });
  });

  describe('Build Output Configuration', () => {
    it('core package should output to dist/', () => {
      const tsconfig = parseJsonc(resolve(packagesDir, 'core', 'tsconfig.json'));

      expect(tsconfig.compilerOptions.outDir).toBe('./dist');
    });

    it('packages should generate declaration files', () => {
      const coreTsconfig = parseJsonc(resolve(packagesDir, 'core', 'tsconfig.json'));

      expect(coreTsconfig.compilerOptions.declaration).toBe(true);
      expect(coreTsconfig.compilerOptions.declarationMap).toBe(true);
    });

    it('packages should use ES2020+ target', () => {
      // Web package explicitly sets target, core inherits from base
      const webTsconfig = parseJsonc(resolve(packagesDir, 'web', 'tsconfig.json'));
      const baseTsconfig = parseJsonc(resolve(rootDir, 'tsconfig.base.json'));

      expect(webTsconfig.compilerOptions.target).toBe('ES2020');
      expect(baseTsconfig.compilerOptions.target).toBe('ES2024');
    });
  });

  describe('Path Alias Resolution', () => {
    it('should resolve internal path aliases correctly', () => {
      // Check if path alias test files exist
      const coreTestFile = resolve(packagesDir, 'core', 'src', 'utils', 'pathAliasTest.ts');
      const webTestFile = resolve(packagesDir, 'web', 'src', 'components', 'PathAliasTest.tsx');

      // These files were created in FFP-20 to verify path aliases
      expect(existsSync(coreTestFile), 'Core path alias test file should exist').toBe(true);
      expect(
        existsSync(webTestFile),
        'Web path alias test file should exist (created in FFP-20)'
      ).toBe(true);
    });

    it('should have moduleResolution set to bundler or node16', () => {
      // Web package explicitly sets moduleResolution, core inherits from base
      const webTsconfig = parseJsonc(resolve(packagesDir, 'web', 'tsconfig.json'));
      const baseTsconfig = parseJsonc(resolve(rootDir, 'tsconfig.base.json'));

      const validOptions = ['bundler', 'node16', 'nodenext'];
      expect(validOptions).toContain(webTsconfig.compilerOptions.moduleResolution);
      expect(validOptions).toContain(baseTsconfig.compilerOptions.moduleResolution);
    });
  });
});
