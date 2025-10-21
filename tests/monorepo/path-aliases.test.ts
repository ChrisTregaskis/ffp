import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

/**
 * Tests to verify TypeScript path aliases are configured correctly
 *
 * FFP-23: Monorepo Setup Tests
 * Validates path alias configuration in tsconfig files
 */

describe('TypeScript Path Aliases', () => {
  const rootDir = resolve(__dirname, '../..');
  const packagesDir = resolve(rootDir, 'packages');

  describe('Base Configuration', () => {
    it('should have tsconfig.base.json at root', () => {
      const tsconfigBase = resolve(rootDir, 'tsconfig.base.json');
      expect(existsSync(tsconfigBase)).toBe(true);
    });

    it('should define @ffp/* path aliases in base config', () => {
      const tsconfigBase = JSON.parse(
        readFileSync(resolve(rootDir, 'tsconfig.base.json'), 'utf-8')
      );

      expect(tsconfigBase.compilerOptions.paths).toBeDefined();
      expect(tsconfigBase.compilerOptions.paths['@ffp/core']).toBeDefined();
    });

    it('should have strict mode enabled', () => {
      const tsconfigBase = JSON.parse(
        readFileSync(resolve(rootDir, 'tsconfig.base.json'), 'utf-8')
      );

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
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'core', 'tsconfig.json'), 'utf-8')
      );

      expect(tsconfig.extends).toBe('../../tsconfig.base.json');
    });

    it('core package should define @core/* aliases', () => {
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'core', 'tsconfig.json'), 'utf-8')
      );

      const paths = tsconfig.compilerOptions?.paths || {};
      expect(paths['@core/lib/*']).toBeDefined();
      expect(paths['@core/types/*']).toBeDefined();
      expect(paths['@core/services/*']).toBeDefined();
      expect(paths['@core/repositories/*']).toBeDefined();
    });

    it('functions package should define @functions/* aliases', () => {
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'functions', 'tsconfig.json'), 'utf-8')
      );

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
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'web', 'tsconfig.json'), 'utf-8')
      );

      const paths = tsconfig.compilerOptions?.paths || {};
      expect(paths['@web/components/*']).toBeDefined();
      expect(paths['@web/hooks/*']).toBeDefined();
      expect(paths['@web/pages/*']).toBeDefined();
    });

    it('web package should have project references to core', () => {
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'web', 'tsconfig.json'), 'utf-8')
      );

      expect(tsconfig.references).toBeDefined();
      expect(tsconfig.references).toContainEqual({ path: '../core' });
    });
  });

  describe('Build Output Configuration', () => {
    it('core package should output to dist/', () => {
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'core', 'tsconfig.json'), 'utf-8')
      );

      expect(tsconfig.compilerOptions.outDir).toBe('./dist');
    });

    it('packages should generate declaration files', () => {
      const coreTsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'core', 'tsconfig.json'), 'utf-8')
      );

      expect(coreTsconfig.compilerOptions.declaration).toBe(true);
      expect(coreTsconfig.compilerOptions.declarationMap).toBe(true);
    });

    it('packages should use ES2022 target', () => {
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'core', 'tsconfig.json'), 'utf-8')
      );

      expect(tsconfig.compilerOptions.target).toBe('ES2022');
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
      const tsconfig = JSON.parse(
        readFileSync(resolve(packagesDir, 'core', 'tsconfig.json'), 'utf-8')
      );

      const validOptions = ['bundler', 'node16', 'nodenext'];
      expect(validOptions).toContain(tsconfig.compilerOptions.moduleResolution);
    });
  });
});
