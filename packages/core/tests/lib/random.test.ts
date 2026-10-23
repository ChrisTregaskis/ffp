import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../../src/lib/random';

const take = (random: () => number, count: number): number[] =>
  Array.from({ length: count }, () => random());

describe('createSeededRandom', () => {
  it('repeats its sequence for the same seed', () => {
    expect(take(createSeededRandom('programme:session'), 20)).toEqual(
      take(createSeededRandom('programme:session'), 20)
    );
  });

  it('gives a different sequence for a different seed', () => {
    expect(take(createSeededRandom('a'), 5)).not.toEqual(take(createSeededRandom('b'), 5));
  });

  it('stays within [0, 1)', () => {
    const values = take(createSeededRandom('range'), 1000);

    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('keeps the sequence a stored seed has always produced', () => {
    // Pinned so a change to the generator, which would redraw every programme, is deliberate
    expect(take(createSeededRandom('seed'), 3)).toEqual([
      0.3376575717702508, 0.7876519507262856, 0.6477281877305359,
    ]);
  });
});
