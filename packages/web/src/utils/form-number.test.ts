import { describe, expect, it } from 'vitest';

import { fieldToNumber, numberToField } from './form-number';

describe('numberToField', () => {
  it('writes a number as its string', () => {
    expect(numberToField(3)).toBe('3');
    expect(numberToField(1.5)).toBe('1.5');
  });

  it('keeps zero rather than treating it as absent', () => {
    expect(numberToField(0)).toBe('0');
  });

  it('gives an empty field for null and undefined', () => {
    expect(numberToField(null)).toBe('');
    expect(numberToField(undefined)).toBe('');
  });
});

describe('fieldToNumber', () => {
  it('reads whole numbers and decimals', () => {
    expect(fieldToNumber('3')).toBe(3);
    expect(fieldToNumber('1.5')).toBe(1.5);
    expect(fieldToNumber('-2')).toBe(-2);
  });

  it('keeps zero', () => {
    expect(fieldToNumber('0')).toBe(0);
  });

  it('trims surrounding whitespace', () => {
    expect(fieldToNumber('  7 ')).toBe(7);
  });

  it('is undefined for a blank field', () => {
    expect(fieldToNumber('')).toBeUndefined();
    expect(fieldToNumber('   ')).toBeUndefined();
  });

  it('is undefined for text that is not a number', () => {
    expect(fieldToNumber('abc')).toBeUndefined();
    expect(fieldToNumber('3 sets')).toBeUndefined();
  });
});
