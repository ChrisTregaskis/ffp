import { describe, expect, it } from 'vitest';

import { findNextSlot } from '../../src/programmes/assembly/helpers';

import { candidate, pool, slot } from './assembly-fixtures';

describe('findNextSlot', () => {
  it('chooses the slot with the fewest candidates', () => {
    const slots = [slot('wide', 0, pool('w', 3)), slot('narrow', 1, pool('n', 1))];

    expect(findNextSlot(slots, new Set()).slotId).toBe('narrow');
  });

  it('counts only the candidates not yet picked', () => {
    const slots = [
      slot('a', 0, [candidate('x'), candidate('y'), candidate('z')]),
      slot('b', 1, [candidate('p'), candidate('q')]),
    ];

    expect(findNextSlot(slots, new Set(['x', 'y'])).slotId).toBe('a');
  });

  it('prefers a required slot on a tie', () => {
    const slots = [slot('optional', 0, pool('o', 2), false), slot('required', 1, pool('r', 2))];

    expect(findNextSlot(slots, new Set()).slotId).toBe('required');
  });

  it('falls back to the slot order on a tie', () => {
    const slots = [slot('second', 1, pool('s', 2)), slot('first', 0, pool('f', 2))];

    expect(findNextSlot(slots, new Set()).slotId).toBe('first');
  });
});
