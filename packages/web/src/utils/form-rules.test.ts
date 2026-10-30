import { describe, expect, it } from 'vitest';

import { requiredText } from './form-rules';

const MESSAGE = 'Please give the phase a name';

describe('requiredText', () => {
  it.each(['', '   ', '\t\n'])('refuses %j with the message', (value) => {
    expect(requiredText(MESSAGE)(value)).toBe(MESSAGE);
  });

  it('accepts a value padded with spaces, which the submit trims', () => {
    expect(requiredText(MESSAGE)('  Foundation  ')).toBe(true);
  });

  it('refuses a field with no value', () => {
    expect(requiredText(MESSAGE)(undefined)).toBe(MESSAGE);
  });
});
