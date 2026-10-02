import { Pool } from 'pg';
import { eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentFlows, questions } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import {
  LEVEL_PROGRAMME_SLUGS,
  LEVEL_SCORING_CONFIG,
} from '../src/constants/level-scoring.constants.js';
import { QUESTION_IDS } from './seedQuestions.js';

import type { ScoringConfig } from '../src/types/question.types.js';

const logger = createLogger('seed-assessment-flows');

/**
 * Deterministic UUIDs for assessment flows
 *
 * UUID Pattern: 44444444-4444-4444-8444-4444444400XX
 */
export const FLOW_IDS = {
  WELLNESS: '44444444-4444-4444-8444-444444440001',
  BRANCHING_DEMO: '44444444-4444-4444-8444-444444440002',
} as const;

/**
 * Deliberately simple: strong on both checks → level 2, otherwise level 1.
 * Neither check feeds the risk level: the branch can skip the strength check,
 * and a skipped check scores 0.
 */
const BRANCHING_DEMO_SCORING_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: 'strength',
      questionIds: [QUESTION_IDS['squat-rating']],
      maxScore: 4,
      affectsRiskLevel: false,
    },
    {
      name: 'balance',
      questionIds: [QUESTION_IDS['single-leg-duration']],
      maxScore: 4,
      affectsRiskLevel: false,
    },
  ],
  programmeMappings: [
    {
      priority: 1,
      operator: 'and',
      conditions: [
        { dimension: 'strength', operator: 'gte', value: 3 },
        { dimension: 'balance', operator: 'gte', value: 3 },
      ],
      programmeTemplateId: LEVEL_PROGRAMME_SLUGS[2],
    },
    { priority: 10, conditions: [], programmeTemplateId: LEVEL_PROGRAMME_SLUGS[1] },
  ],
};

const DEFAULT_FLOWS = [
  {
    id: FLOW_IDS.WELLNESS,
    name: 'Wellness Movement Assessment',
    description: 'A short check-in on activity, goals and safety that sets your starting level',
    scoringConfig: LEVEL_SCORING_CONFIG,
  },
  {
    id: FLOW_IDS.BRANCHING_DEMO,
    name: 'Movement Check Demo',
    description: 'A reduced flow with a branching rule and video-guided movement checks',
    scoringConfig: BRANCHING_DEMO_SCORING_CONFIG,
  },
];

/** A config naming a missing or mis-dimensioned question would silently drop it from scoring */
const assertScoringConfigMatchesQuestions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  flowName: string,
  scoringConfig: ScoringConfig
): Promise<void> => {
  const listed = scoringConfig.dimensions.flatMap((dimension) =>
    dimension.questionIds.map((questionId) => ({ questionId, dimension: dimension.name }))
  );
  const stored = await db
    .select({ id: questions.id, scoreDimension: questions.scoreDimension })
    .from(questions)
    .where(
      inArray(
        questions.id,
        listed.map(({ questionId }) => questionId)
      )
    );
  const storedDimensions = new Map(
    stored.map((question) => [question.id, question.scoreDimension])
  );

  const problems = listed.flatMap(({ questionId, dimension }) => {
    if (!storedDimensions.has(questionId)) {
      return [`${dimension}: question ${questionId} does not exist`];
    }
    const actual = storedDimensions.get(questionId);
    return actual === dimension
      ? []
      : [`${dimension}: question ${questionId} carries dimension ${actual ?? 'none'}`];
  });

  if (problems.length > 0) {
    throw new Error(`Scoring config for "${flowName}" is invalid:\n${problems.join('\n')}`);
  }
};

/**
 * Seeds the assessment flows. IDEMPOTENT: flows are matched by ID, and an
 * existing one is brought back in line with the seed. Runs after seedQuestions,
 * because each scoring config is checked against the stored questions.
 */
export const seedAssessmentFlows = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding assessment flows...');

  let createdCount = 0;

  for (const flow of DEFAULT_FLOWS) {
    await assertScoringConfigMatchesQuestions(db, flow.name, flow.scoringConfig);

    const existingFlow = await db.query.assessmentFlows.findFirst({
      where: eq(assessmentFlows.id, flow.id),
    });

    if (existingFlow) {
      await db
        .update(assessmentFlows)
        .set({
          name: flow.name,
          description: flow.description,
          scoringConfig: flow.scoringConfig,
        })
        .where(eq(assessmentFlows.id, flow.id));

      logger.info('Assessment flow updated', { id: flow.id, name: flow.name });
      continue;
    }

    // Normalised steps are in flow_steps table (see seedFlowSteps.ts)
    await db.insert(assessmentFlows).values({ ...flow, isActive: true });

    logger.info('Assessment flow created', { id: flow.id, name: flow.name });
    createdCount++;
  }

  return createdCount;
};
