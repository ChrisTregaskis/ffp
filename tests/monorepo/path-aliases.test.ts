import { readFileSync } from 'fs';
import { resolve } from 'path';

import stripJsonComments from 'strip-json-comments';
import { describe, it, expect } from 'vitest';

/**
 * Pins strict TypeScript settings in the shared base config
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

  describe('Base Configuration', () => {
    it('should have strict mode enabled', () => {
      const tsconfigBase = parseJsonc(resolve(rootDir, 'tsconfig.base.json'));

      expect(tsconfigBase.compilerOptions.strict).toBe(true);
      expect(tsconfigBase.compilerOptions.noUnusedLocals).toBe(true);
      expect(tsconfigBase.compilerOptions.noUnusedParameters).toBe(true);
    });
  });
});
