import { describe, it, expect } from 'vitest';

/**
 * Pins that each package keeps a lint script: turbo lint silently skips a package without one
 */

describe('Code Quality Tools', () => {
  describe('Lint Execution', () => {
    it('should have lint scripts in packages', () => {
      const packages = ['core', 'web', 'functions'];

      packages.forEach((pkgName) => {
        const pkg = require(`../../packages/${pkgName}/package.json`);
        expect(pkg.scripts.lint, `${pkgName} should have lint script`).toBeDefined();
      });
    });
  });
});
