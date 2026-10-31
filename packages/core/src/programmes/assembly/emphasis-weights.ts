import type { AnswerValue } from '@ffp/database';

import type { EmphasisWeights } from './assembly.types';
import type { EmphasisRule } from '../../schemas/scoring-config.schema';

export interface ResolvedEmphasis {
  weights: EmphasisWeights;
  /** Tags the matched rules name that don't exist or aren't active, as `category:slug` */
  ignoredTags: string[];
}

const answerMatches = (answer: AnswerValue | undefined, value: string): boolean =>
  Array.isArray(answer) ? answer.includes(value) : answer === value;

/**
 * The weight each tag (`category:slug`) adds, summed over the rules the member's answers match.
 * Only tags in `activeTagKeys` count, so a mapping can name a tag before it is authored.
 */
export function resolveEmphasisWeights(
  rules: EmphasisRule[],
  answers: ReadonlyMap<string, AnswerValue>,
  activeTagKeys: ReadonlySet<string>
): ResolvedEmphasis {
  const weights = new Map<string, number>();
  const ignoredTags = new Set<string>();

  for (const rule of rules) {
    if (!answerMatches(answers.get(rule.questionId), rule.answerValue)) {
      continue;
    }

    for (const { category, slug, weight } of rule.tags) {
      const tagKey = `${category}:${slug}`;

      if (activeTagKeys.has(tagKey)) {
        weights.set(tagKey, (weights.get(tagKey) ?? 0) + weight);
      } else {
        ignoredTags.add(tagKey);
      }
    }
  }

  return { weights, ignoredTags: [...ignoredTags] };
}
