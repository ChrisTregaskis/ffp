import { describe, expect, it } from 'vitest';

import { assembleSession } from '../../src/programmes/assembly';

import {
  FOUR_SLOTS_ON_A_POOL_OF_FOUR,
  NO_EMPHASIS,
  candidate,
  pool,
  seeds,
  slot,
} from './assembly-fixtures';

import type { AssemblySlot } from '../../src/programmes/assembly';

const videoIds = (slots: AssemblySlot[], seed: string, emphasis = NO_EMPHASIS): string[] =>
  assembleSession({ slots, emphasis, seed }).picks.map((pick) => pick.videoId);

describe('assembleSession', () => {
  it('fills every required slot when the pools allow it', () => {
    const slots = [
      slot('a', 0, pool('a', 3)),
      slot('b', 1, pool('b', 2)),
      slot('c', 2, pool('c', 1)),
    ];

    const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed: 'seed' });

    expect(result.picks.map((pick) => pick.slotId)).toEqual(['a', 'b', 'c']);
    expect(result.unfilledRequired).toEqual([]);
    expect(result.skippedOptional).toEqual([]);
  });

  it('never repeats an exercise within a session', () => {
    const shared = pool('shared', 3);
    const slots = [slot('a', 0, shared), slot('b', 1, shared), slot('c', 2, shared)];

    for (const seed of seeds(50)) {
      const picked = videoIds(slots, seed);

      expect(new Set(picked).size).toBe(3);
    }
  });

  it('fills four slots sharing a pool of exactly four', () => {
    for (const seed of seeds(50)) {
      const result = assembleSession({
        slots: FOUR_SLOTS_ON_A_POOL_OF_FOUR,
        emphasis: NO_EMPHASIS,
        seed,
      });

      expect(result.unfilledRequired).toEqual([]);
      expect(new Set(result.picks.map((pick) => pick.videoId)).size).toBe(4);
    }
  });

  it('fills a narrow slot that shares its only exercise with a wider one', () => {
    const slots = [
      slot('wide', 0, [candidate('only'), candidate('other')]),
      slot('narrow', 1, [candidate('only')]),
    ];

    for (const seed of seeds(50)) {
      const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed });

      expect(result.unfilledRequired).toEqual([]);
      expect(result.picks).toEqual([
        { slotId: 'wide', videoId: 'other' },
        { slotId: 'narrow', videoId: 'only' },
      ]);
    }
  });

  it('fills every slot when pools overlap unevenly', () => {
    const slots = [
      slot('a', 0, [candidate('x')]),
      slot('b', 1, [candidate('y'), candidate('z'), candidate('w')]),
      slot('c', 2, [candidate('x'), candidate('y'), candidate('w')]),
      slot('d', 3, [candidate('y'), candidate('w')]),
    ];

    for (const seed of seeds(50)) {
      const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed });

      expect(result.unfilledRequired).toEqual([]);
      expect(new Set(result.picks.map((pick) => pick.videoId)).size).toBe(4);
    }
  });

  it.each([
    ['', false],
    [' even when the stranding pick is essential', true],
  ])('takes a different pick when the first would strand a later slot%s', (_, isEssential) => {
    // The narrow slot fills first; taking `shared` leaves three wide slots two exercises
    const wide = [candidate('v1'), candidate('v2'), candidate('shared')];
    const slots = [
      slot('a', 0, wide),
      slot('b', 1, wide),
      slot('c', 2, wide),
      slot('narrow', 3, [candidate('shared', { isEssential }), candidate('v4')]),
    ];

    for (const seed of seeds(50)) {
      const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed });

      expect(result.unfilledRequired).toEqual([]);
      expect(result.picks.find((pick) => pick.slotId === 'narrow')?.videoId).toBe('v4');
    }
  });

  it('skips an optional slot when filling it would strand a required one', () => {
    const shared = [candidate('x'), candidate('y')];
    const slots = [
      slot('optional', 0, [candidate('x')], false),
      slot('a', 1, shared),
      slot('b', 2, shared),
    ];

    for (const seed of seeds(20)) {
      const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed });

      expect(result.unfilledRequired).toEqual([]);
      expect(result.skippedOptional).toEqual(['optional']);
      expect(result.picks.map((pick) => pick.slotId)).toEqual(['a', 'b']);
    }
  });

  it('prefers essential exercises when the pool has any', () => {
    const slots = [
      slot('a', 0, [
        candidate('nice-1'),
        candidate('essential', { isEssential: true }),
        candidate('nice-2'),
      ]),
    ];

    for (const seed of seeds(50)) {
      expect(videoIds(slots, seed)).toEqual(['essential']);
    }
  });

  it('draws from the rest once the essential exercises are taken', () => {
    const slots = [
      slot('a', 0, [candidate('essential', { isEssential: true }), candidate('nice')]),
      slot('b', 1, [candidate('essential', { isEssential: true }), candidate('nice')]),
    ];

    const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed: 'seed' });

    expect(result.picks.map((pick) => pick.videoId).sort()).toEqual(['essential', 'nice']);
  });

  it('skips an optional slot with an empty pool', () => {
    const slots = [slot('a', 0, pool('a', 2)), slot('optional', 1, [], false)];

    const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed: 'seed' });

    expect(result.picks.map((pick) => pick.slotId)).toEqual(['a']);
    expect(result.skippedOptional).toEqual(['optional']);
    expect(result.unfilledRequired).toEqual([]);
  });

  it('reports a required slot with an empty pool', () => {
    const slots = [slot('a', 0, pool('a', 2)), slot('empty', 1, [])];

    const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed: 'seed' });

    expect(result.unfilledRequired).toEqual(['empty']);
    expect(result.picks.map((pick) => pick.slotId)).toEqual(['a']);
  });

  it('reports a required slot whose pool the other slots used up', () => {
    const slots = [slot('a', 0, [candidate('x')]), slot('b', 1, [candidate('x')])];

    const result = assembleSession({ slots, emphasis: NO_EMPHASIS, seed: 'seed' });

    expect(result.picks).toEqual([{ slotId: 'a', videoId: 'x' }]);
    expect(result.unfilledRequired).toEqual(['b']);
  });

  it('draws the same exercises from the same seed', () => {
    const slots = [slot('a', 0, pool('a', 10)), slot('b', 1, pool('b', 10))];

    for (const seed of seeds(20)) {
      expect(videoIds(slots, seed)).toEqual(videoIds(slots, seed));
    }
  });

  it('does not depend on the order the pool arrives in', () => {
    const forwards = pool('a', 10);
    const slots = [slot('a', 0, forwards)];
    const reversed = [slot('a', 0, [...forwards].reverse())];

    for (const seed of seeds(20)) {
      expect(videoIds(reversed, seed)).toEqual(videoIds(slots, seed));
    }
  });

  it('draws different exercises from different seeds when the pool has room', () => {
    const slots = [slot('a', 0, pool('a', 10)), slot('b', 1, pool('b', 10))];

    const draws = new Set(seeds(20).map((seed) => videoIds(slots, seed).join(',')));

    expect(draws.size).toBeGreaterThan(10);
  });

  it('reaches every candidate in a pool across seeds', () => {
    const slots = [slot('a', 0, pool('a', 5))];

    const drawn = new Set(seeds(200).flatMap((seed) => videoIds(slots, seed)));

    expect(drawn.size).toBe(5);
  });
});
