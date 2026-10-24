import { describe, expect, it } from 'vitest';

import { assembleSession, resolveEmphasisWeights } from '../../src/programmes/assembly';
import { emphasisRulesSchema } from '../../src/schemas/scoring-config.schema';

import { NO_EMPHASIS, candidate, seeds, slot } from './assembly-fixtures';

import type { EmphasisRule } from '../../src/schemas/scoring-config.schema';

const ACTIVITY = '22222222-2222-4222-8222-222222220703';
const FOCUS = '22222222-2222-4222-8222-222222220707';

const RULES: EmphasisRule[] = [
  {
    questionId: ACTIVITY,
    answerValue: 'low',
    tags: [
      { category: 'movement', slug: 'stretch', weight: 2 },
      { category: 'movement', slug: 'mobility', weight: 2 },
    ],
  },
  {
    questionId: FOCUS,
    answerValue: 'neck-shoulders',
    tags: [
      { category: 'body-area', slug: 'neck', weight: 1 },
      { category: 'movement', slug: 'stretch', weight: 1 },
    ],
  },
  {
    questionId: FOCUS,
    answerValue: 'hips-lower-body',
    tags: [{ category: 'body-area', slug: 'hips', weight: 1 }],
  },
];

const ACTIVE = new Set([
  'movement:stretch',
  'movement:mobility',
  'body-area:neck',
  'body-area:hips',
]);

describe('resolveEmphasisWeights', () => {
  it('sums the weights of every rule the answers match', () => {
    const { weights, ignoredTags } = resolveEmphasisWeights(
      RULES,
      new Map<string, string | string[]>([
        [ACTIVITY, 'low'],
        [FOCUS, ['neck-shoulders']],
      ]),
      ACTIVE
    );

    expect(Object.fromEntries(weights)).toEqual({
      'movement:stretch': 3,
      'movement:mobility': 2,
      'body-area:neck': 1,
    });
    expect(ignoredTags).toEqual([]);
  });

  it('matches a multi-choice answer that includes the value', () => {
    const { weights } = resolveEmphasisWeights(
      RULES,
      new Map([[FOCUS, ['neck-shoulders', 'hips-lower-body']]]),
      ACTIVE
    );

    expect([...weights.keys()].sort()).toEqual([
      'body-area:hips',
      'body-area:neck',
      'movement:stretch',
    ]);
  });

  it('matches nothing for an answer the rules do not name', () => {
    const { weights } = resolveEmphasisWeights(RULES, new Map([[ACTIVITY, 'active']]), ACTIVE);

    expect(weights.size).toBe(0);
  });

  it('ignores and reports tags that are missing or inactive', () => {
    const { weights, ignoredTags } = resolveEmphasisWeights(
      [
        {
          questionId: ACTIVITY,
          answerValue: 'low',
          tags: [
            { category: 'goal', slug: 'relieve-tension', weight: 2 },
            { category: 'movement', slug: 'stretch', weight: 1 },
          ],
        },
      ],
      new Map([[ACTIVITY, 'low']]),
      ACTIVE
    );

    expect(Object.fromEntries(weights)).toEqual({ 'movement:stretch': 1 });
    expect(ignoredTags).toEqual(['goal:relieve-tension']);
  });
});

describe('emphasis in the draw', () => {
  const slots = [
    slot('a', 0, [
      candidate('stretch', { tagKeys: ['movement:stretch'] }),
      candidate('strength', { tagKeys: ['movement:strength'] }),
    ]),
  ];

  const shareDrawn = (emphasis: ReadonlyMap<string, number>, videoId: string): number => {
    const all = seeds(400);
    const drawn = all.filter(
      (seed) => assembleSession({ slots, emphasis, seed }).picks[0].videoId === videoId
    );

    return drawn.length / all.length;
  };

  it('draws an emphasised exercise more often', () => {
    expect(shareDrawn(new Map([['movement:stretch', 9]]), 'stretch')).toBeGreaterThan(0.8);
    expect(shareDrawn(NO_EMPHASIS, 'stretch')).toBeLessThan(0.65);
  });

  it('still prefers an essential exercise over an emphasised one', () => {
    const withEssential = [
      slot('a', 0, [
        candidate('stretch', { tagKeys: ['movement:stretch'] }),
        candidate('essential', { isEssential: true }),
      ]),
    ];

    for (const seed of seeds(50)) {
      const result = assembleSession({
        slots: withEssential,
        emphasis: new Map([['movement:stretch', 9]]),
        seed,
      });

      expect(result.picks[0].videoId).toBe('essential');
    }
  });
});

describe('the emphasis rules schema', () => {
  it('accepts well-formed rules, and no rules at all', () => {
    expect(emphasisRulesSchema.safeParse(RULES).success).toBe(true);
    expect(emphasisRulesSchema.safeParse([]).success).toBe(true);
  });

  it.each([
    ['an unknown category', { category: 'colour', slug: 'stretch', weight: 1 }],
    ['a weight of zero', { category: 'movement', slug: 'stretch', weight: 0 }],
    ['a negative weight', { category: 'movement', slug: 'stretch', weight: -1 }],
    ['an empty slug', { category: 'movement', slug: '', weight: 1 }],
  ])('refuses a tag with %s', (_, tag) => {
    expect(
      emphasisRulesSchema.safeParse([{ questionId: ACTIVITY, answerValue: 'low', tags: [tag] }])
        .success
    ).toBe(false);
  });

  it('refuses a rule naming a question by anything but its id, or naming no tags', () => {
    expect(
      emphasisRulesSchema.safeParse([
        { questionId: 'weekly-activity', answerValue: 'low', tags: RULES[0].tags },
      ]).success
    ).toBe(false);
    expect(
      emphasisRulesSchema.safeParse([{ questionId: ACTIVITY, answerValue: 'low', tags: [] }])
        .success
    ).toBe(false);
  });
});
