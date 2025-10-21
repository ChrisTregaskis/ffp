import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Tests to verify Turborepo caching configuration
 *
 * FFP-23: Monorepo Setup Tests
 * Validates Turborepo pipeline and caching setup
 */

describe('Turborepo Configuration', () => {
  const rootDir = resolve(__dirname, '../..');

  describe('Configuration Files', () => {
    it('should have turbo.json', () => {
      const turboJson = resolve(rootDir, 'turbo.json');
      expect(existsSync(turboJson)).toBe(true);
    });

    it('should have valid JSON', () => {
      const turboJson = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
      expect(turboJson).toBeDefined();
    });
  });

  describe('Pipeline Configuration', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('should define build task', () => {
      expect(turboConfig.tasks.build).toBeDefined();
    });

    it('should define test task', () => {
      expect(turboConfig.tasks.test).toBeDefined();
    });

    it('should define lint task', () => {
      expect(turboConfig.tasks.lint).toBeDefined();
    });

    it('should define typecheck task', () => {
      expect(turboConfig.tasks.typecheck).toBeDefined();
    });

    it('should define dev task', () => {
      expect(turboConfig.tasks.dev).toBeDefined();
    });

    it('should define clean task', () => {
      expect(turboConfig.tasks.clean).toBeDefined();
    });
  });

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

    it('dev should depend on ^build for dependencies', () => {
      expect(turboConfig.tasks.dev.dependsOn).toContain('^build');
    });
  });

  describe('Caching Configuration', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('build task should have caching enabled', () => {
      expect(turboConfig.tasks.build.cache).toBe(true);
    });

    it('test task should have caching enabled', () => {
      expect(turboConfig.tasks.test.cache).toBe(true);
    });

    it('lint task should have caching enabled', () => {
      expect(turboConfig.tasks.lint.cache).toBe(true);
    });

    it('typecheck task should have caching enabled', () => {
      expect(turboConfig.tasks.typecheck.cache).toBe(true);
    });

    it('dev task should NOT have caching', () => {
      expect(turboConfig.tasks.dev.cache).toBe(false);
    });

    it('clean task should NOT have caching', () => {
      expect(turboConfig.tasks.clean.cache).toBe(false);
    });
  });

  describe('Cache Outputs', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('build should define output directories', () => {
      expect(turboConfig.tasks.build.outputs).toBeDefined();
      expect(turboConfig.tasks.build.outputs.length).toBeGreaterThan(0);
    });

    it('build should include dist/** in outputs', () => {
      expect(turboConfig.tasks.build.outputs).toContain('dist/**');
    });

    it('test should include coverage/** in outputs', () => {
      expect(turboConfig.tasks.test.outputs).toContain('coverage/**');
    });
  });

  describe('Input Configuration', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('build should use $TURBO_DEFAULT$ as base', () => {
      expect(turboConfig.tasks.build.inputs).toContain('$TURBO_DEFAULT$');
    });

    it('build should exclude markdown files from inputs', () => {
      expect(turboConfig.tasks.build.inputs).toContain('!**/*.md');
    });

    it('build should exclude test files from inputs', () => {
      const testExclusions = turboConfig.tasks.build.inputs.filter(
        (input: string) => input.includes('.test.') || input.includes('.spec.')
      );
      expect(testExclusions.length).toBeGreaterThan(0);
    });
  });

  describe('Global Configuration', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('should track global dependencies', () => {
      expect(turboConfig.globalDependencies).toBeDefined();
      expect(Array.isArray(turboConfig.globalDependencies)).toBe(true);
    });

    it('should track tsconfig.base.json as global dependency', () => {
      expect(turboConfig.globalDependencies).toContain('tsconfig.base.json');
    });

    it('should track .eslintrc.js as global dependency', () => {
      expect(turboConfig.globalDependencies).toContain('.eslintrc.js');
    });

    it('should track .prettierrc.js as global dependency', () => {
      expect(turboConfig.globalDependencies).toContain('.prettierrc.js');
    });

    it('should define global environment variables', () => {
      expect(turboConfig.globalEnv).toBeDefined();
      expect(Array.isArray(turboConfig.globalEnv)).toBe(true);
    });
  });

  describe('Output Logging', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('typecheck should use errors-only logging', () => {
      expect(turboConfig.tasks.typecheck.outputLogs).toBe('errors-only');
    });

    it('lint should use errors-only logging', () => {
      expect(turboConfig.tasks.lint.outputLogs).toBe('errors-only');
    });

    it('test should use new-only logging', () => {
      expect(turboConfig.tasks.test.outputLogs).toBe('new-only');
    });
  });

  describe('Remote Caching', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('should have remoteCache configuration', () => {
      expect(turboConfig.remoteCache).toBeDefined();
    });

    it('remote caching should be disabled for Phase 1', () => {
      // Phase 1 = solo dev, no remote cache needed yet
      expect(turboConfig.remoteCache.enabled).toBe(false);
    });
  });

  describe('Package Scripts Integration', () => {
    it('root package.json should use turbo for build', () => {
      const pkg = require('../../package.json');
      expect(pkg.scripts.build).toContain('turbo');
    });

    it('root package.json should use turbo for test', () => {
      const pkg = require('../../package.json');
      expect(pkg.scripts.test).toContain('turbo');
    });

    it('root package.json should use turbo for lint', () => {
      const pkg = require('../../package.json');
      expect(pkg.scripts.lint).toContain('turbo');
    });

    it('root package.json should use turbo for dev', () => {
      const pkg = require('../../package.json');
      expect(pkg.scripts.dev).toContain('turbo');
    });
  });

  describe('Cache Directory', () => {
    it('should have .turbo in .gitignore', () => {
      const gitignore = readFileSync(resolve(rootDir, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('.turbo');
    });

    it('should have node_modules/.cache in .gitignore', () => {
      const gitignore = readFileSync(resolve(rootDir, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('node_modules');
    });
  });

  describe('Persistent Tasks', () => {
    let turboConfig: any;

    beforeAll(() => {
      turboConfig = JSON.parse(readFileSync(resolve(rootDir, 'turbo.json'), 'utf-8'));
    });

    it('dev task should be persistent', () => {
      expect(turboConfig.tasks.dev.persistent).toBe(true);
    });

    it('preview task should be persistent if defined', () => {
      if (turboConfig.tasks.preview) {
        expect(turboConfig.tasks.preview.persistent).toBe(true);
      }
    });
  });
});
