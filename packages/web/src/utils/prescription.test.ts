import { describe, expect, it } from 'vitest';

import { formatPrescription, formatSeconds, prescriptionParts } from './prescription';

describe('formatPrescription', () => {
  it('reads sets, reps and rest on one line, with a numeric range as an en dash', () => {
    expect(
      formatPrescription({ sets: 3, reps: '8-12', durationSeconds: null, restSeconds: 45 })
    ).toBe('3 sets × 8–12 · Rest 45s');
  });

  it('includes a duration between the sets and the rest', () => {
    expect(
      formatPrescription({ sets: 2, reps: '30s hold', durationSeconds: 90, restSeconds: 20 })
    ).toBe('2 sets × 30s hold · 1m 30s · Rest 20s');
  });

  it('says one set, and leaves out rest and duration when there are none', () => {
    expect(
      formatPrescription({ sets: 1, reps: '10 each side', durationSeconds: null, restSeconds: 0 })
    ).toBe('1 set × 10 each side');
  });
});

describe('prescriptionParts', () => {
  it('gives each label on its own for the badge screens', () => {
    expect(
      prescriptionParts({ sets: 3, reps: '12', durationSeconds: 30, restSeconds: 60 })
    ).toEqual({ setsAndReps: '3 sets × 12', duration: '30s', rest: 'Rest 1m' });
  });
});

describe('formatSeconds', () => {
  it.each([
    [45, '45s'],
    [120, '2m'],
    [75, '1m 15s'],
  ])('reads %i seconds as %s', (seconds, expected) => {
    expect(formatSeconds(seconds)).toBe(expected);
  });
});
