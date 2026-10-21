import { readFileSync } from 'fs';
import { resolve } from 'path';

import stripJsonComments from 'strip-json-comments';
import { describe, it, expect } from 'vitest';

const rootDir = resolve(__dirname, '../..');

interface PackageJson {
  scripts: Record<string, string | undefined>;
}

interface TsconfigJson {
  compilerOptions: Record<string, unknown>;
}

interface TurboJson {
  tasks: Record<string, { dependsOn?: string[] }>;
}

const readJson = <T>(relativePath: string): T =>
  JSON.parse(stripJsonComments(readFileSync(resolve(rootDir, relativePath), 'utf-8'))) as T;

describe('Monorepo invariants', () => {
  // turbo lint silently skips a package with no lint script
  it.each(['core', 'web', 'functions', 'database'])('%s keeps an eslint lint script', (name) => {
    const pkg = readJson<PackageJson>(`packages/${name}/package.json`);

    expect(pkg.scripts.lint).toMatch(/^eslint /);
  });

  it('the base tsconfig keeps strict mode and the unused-code checks on', () => {
    const { compilerOptions } = readJson<TsconfigJson>('tsconfig.base.json');

    expect(compilerOptions).toMatchObject({
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
    });
  });

  // Without this order, tasks run against stale builds and nothing fails
  describe('Turborepo task order', () => {
    const { tasks } = readJson<TurboJson>('turbo.json');

    it('build depends on its dependencies building first (^build)', () => {
      expect(tasks.build.dependsOn).toContain('^build');
    });

    it('test depends on build', () => {
      expect(tasks.test.dependsOn).toContain('build');
    });

    it('typecheck depends on its dependencies building first (^build)', () => {
      expect(tasks.typecheck.dependsOn).toContain('^build');
    });
  });
});
