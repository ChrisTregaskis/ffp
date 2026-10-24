import { getDb, type QuestionWithConfig, type ScoringConfig } from '@ffp/database';
import { levelForProgrammeSlug } from '@ffp/database/constants';

import { type OrganisationContext } from '../lib/context';
import { assertDistinctIds } from '../lib/distinct-ids';
import { NotFoundError, ValidationError } from '../lib/errors';
import { findTemplateNamesBySlugs } from '../programme-templates/programme-template.repository';
import { findByTemplateIds } from '../questions/question.repository';
import { findTemplateIdsOfSteps } from '../schemas/assessment-flow.schema';
import {
  answerErrorPath,
  isAnswerProvided,
  resolveEffectiveValidation,
  validateAnswer,
} from '../schemas/question-answer.schema';
import {
  scoringDryRunRequestSchema,
  type ScoringDryRunRequest,
  type ScoringDryRunDimension,
  type ScoringDryRunMapping,
  type ScoringDryRunResult,
} from '../schemas/scoring-dry-run.schema';

import * as flowRepository from './flow.repository';
import { calculateScores } from './scoring';
import { formatDimensionName } from './scoring/helpers';

import type { QuestionType } from '../schemas/assessment-question.schema';
import type { AssessmentResponse } from '../schemas/job.schema';

/** Scores answers against a flow's scoring config, loading questions as the scoring job does. Writes nothing. */
export async function dryRunFlowScoringService(
  _ctx: OrganisationContext,
  flowPublicId: string,
  input: unknown
): Promise<ScoringDryRunResult> {
  const parseResult = scoringDryRunRequestSchema.safeParse(input);

  if (!parseResult.success) {
    throw new ValidationError('Invalid scoring dry-run input', {
      errors: parseResult.error.issues,
    });
  }

  const db = getDb();
  const flow = await flowRepository.findByPublicId(db, flowPublicId);

  if (!flow) {
    throw new NotFoundError('Assessment flow', flowPublicId);
  }

  const config = flow.scoringConfig;

  if (!config) {
    return { scorable: false, reason: 'no-config' };
  }

  if (config.dimensions.length === 0) {
    return { scorable: false, reason: 'no-dimensions' };
  }

  const steps = await flowRepository.findStepsByFlowId(db, flow.id);
  const questions = await findByTemplateIds(db, findTemplateIdsOfSteps(steps));
  const questionsByPublicId = new Map(questions.map((question) => [question.publicId, question]));

  const responses = toResponses(parseResult.data.answers, questionsByPublicId);
  const result = calculateScores(responses, questions, config);
  const programmes = await findProgrammes(db, config);

  return {
    scorable: true,
    dimensions: toDimensions(config, questions),
    mappings: config.programmeMappings.map(
      (mapping, index): ScoringDryRunMapping => ({
        index,
        priority: mapping.priority,
        operator: mapping.operator ?? 'and',
        conditions: mapping.conditions,
        programmeSlug: mapping.programmeTemplateId,
        programmeName: programmes.get(mapping.programmeTemplateId)?.name ?? null,
        programmeActive: programmes.get(mapping.programmeTemplateId)?.isActive ?? null,
        level: levelForProgrammeSlug(mapping.programmeTemplateId),
      })
    ),
    result: {
      scores: result.scores,
      overallScore: result.overallScore,
      riskLevel: result.riskLevel,
      recommendedProgrammeSlug: result.recommendedProgrammeId,
      matchedMappingIndex: result.matchedMappingIndex,
    },
  };
}

function toDimensions(
  config: ScoringConfig,
  questions: QuestionWithConfig[]
): ScoringDryRunDimension[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]));

  return config.dimensions.map((dimension) => {
    const shown = dimension.questionIds
      .map((questionId) => questionsById.get(questionId))
      .filter((question): question is QuestionWithConfig => question !== undefined);

    return {
      name: dimension.name,
      displayName: formatDimensionName(dimension.name),
      scoringMode: dimension.scoringMode ?? 'sum',
      maxScore: dimension.maxScore,
      affectsRiskLevel: dimension.affectsRiskLevel ?? true,
      questions: shown.map((question) => ({
        publicId: question.publicId,
        slug: question.slug,
        type: question.type as QuestionType,
        questionText: question.configOverrides?.questionText ?? question.questionText,
        options: question.options,
      })),
      unresolvedQuestionCount: dimension.questionIds.length - shown.length,
    };
  });
}

async function findProgrammes(
  db: ReturnType<typeof getDb>,
  config: ScoringConfig
): Promise<Map<string, { name: string; isActive: boolean }>> {
  const slugs = [
    ...new Set(config.programmeMappings.map((mapping) => mapping.programmeTemplateId)),
  ];
  const templates = await findTemplateNamesBySlugs(db, slugs);

  return new Map(templates.map((template) => [template.slug, template]));
}

/** Blank answers are skipped, as a member save deletes them; required is not enforced. */
function toResponses(
  answers: ScoringDryRunRequest['answers'],
  questionsByPublicId: ReadonlyMap<string, QuestionWithConfig>
): AssessmentResponse[] {
  assertDistinctIds(
    answers.map((answer) => answer.questionPublicId),
    'Answered question'
  );

  return answers
    .filter((answer) => isAnswerProvided(answer.answerValue))
    .map((answer) => {
      const question = questionsByPublicId.get(answer.questionPublicId);

      if (!question) {
        throw new ValidationError('An answer names a question this flow does not show', {
          questionPublicId: answer.questionPublicId,
        });
      }

      const issue = validateAnswer(
        {
          type: question.type as QuestionType,
          options: question.options,
          validation: { ...resolveEffectiveValidation(question), required: false },
        },
        answer.answerValue
      ).at(0);

      if (issue) {
        throw new ValidationError('An answer does not suit its question', [
          {
            path: answerErrorPath(answer.questionPublicId),
            code: issue.code,
            message: issue.message,
          },
        ]);
      }

      return { questionId: question.id, answerValue: answer.answerValue };
    });
}
