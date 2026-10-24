import * as answerRepository from '../assessments/answer.repository';
import { findFlowById } from '../assessments/flow.repository';
import { findUserAssessmentById } from '../assessments/user-assessment.repository';
import { createSystemLogger } from '../lib/logger';
import { emphasisRulesSchema } from '../schemas/scoring-config.schema';
import * as tagRepository from '../tags/tag.repository';

import { resolveEmphasisWeights, type EmphasisWeights } from './assembly';

import type { Transaction } from '../lib/database';

const logger = createSystemLogger('programme-emphasis');

const NO_EMPHASIS: EmphasisWeights = new Map();

/**
 * The emphasis weights an assessment's answers give its programme, from the rules in its flow's
 * scoring config. A malformed config, or a tag the rules name that isn't authored and active, is
 * ignored with a WARN rather than failing generation.
 */
export async function findEmphasisWeights(
  tx: Transaction,
  organisationId: string,
  assessmentId: string
): Promise<EmphasisWeights> {
  const assessment = await findUserAssessmentById(organisationId, assessmentId, { tx });

  if (!assessment) {
    return NO_EMPHASIS;
  }

  const flow = await findFlowById(tx, assessment.flowId);
  const rules = emphasisRulesSchema.safeParse(flow?.scoringConfig?.emphasis ?? []);

  if (!rules.success) {
    logger.warn('Emphasis config is malformed and was ignored', { flowId: assessment.flowId });

    return NO_EMPHASIS;
  }

  if (rules.data.length === 0) {
    return NO_EMPHASIS;
  }

  const [answers, tags] = await Promise.all([
    answerRepository.findByAssessmentId(organisationId, assessmentId, { tx }),
    tagRepository.findAllTags(tx),
  ]);
  const { weights, ignoredTags } = resolveEmphasisWeights(
    rules.data,
    new Map(answers.map((answer) => [answer.questionId, answer.answerValue])),
    new Set(tags.filter((tag) => tag.isActive).map((tag) => `${tag.category}:${tag.slug}`))
  );

  if (ignoredTags.length > 0) {
    logger.warn('Emphasis names tags that are missing or inactive', {
      flowId: assessment.flowId,
      tags: ignoredTags,
    });
  }

  return weights;
}
