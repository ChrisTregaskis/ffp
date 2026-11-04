import { eq, inArray } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { LEVEL_SCORING_CONFIG } from '../src/constants/level-scoring.constants.js';
import { createLogger } from '../src/lib/logger.js';
import { assessmentFlows, questions } from '../src/schema/index.js';

import { QUESTION_IDS } from './seedQuestions.js';

import type * as schema from '../src/schema/index.js';
import type { EmphasisRule, EmphasisTag, ScoringConfig } from '../src/types/question.types.js';

const logger = createLogger('seed-assessment-flows');

/**
 * Deterministic UUIDs for assessment flows
 *
 * UUID Pattern: 44444444-4444-4444-8444-4444444400XX (the branching demo is 0002)
 */
export const FLOW_IDS = {
  WELLNESS: '44444444-4444-4444-8444-444444440001',
} as const;

export interface SeedFlow {
  id: string;
  name: string;
  description: string;
  scoringConfig: ScoringConfig;
}

const lean = (
  questionId: string,
  answerValue: string,
  tags: Record<string, number>,
  category: EmphasisTag['category']
): EmphasisRule => ({
  questionId,
  answerValue,
  tags: Object.entries(tags).map(([slug, weight]) => ({ category, slug, weight })),
});

/**
 * How the Wellness answers lean a programme's draw. A less active member's stretch and mobility
 * outweigh strength whatever the goal, even a strength video carrying the goal's own tag, so the
 * low-activity lean exceeds the most a goal adds to one video. The goal adds its goal tag and a
 * lighter movement lean; focus areas lean to their body areas; "full body" leans nowhere. A lean
 * only chooses between movements where a slot's pool mixes them: a slot narrowed to one movement
 * keeps it. The goal tags are named before they are authored and count once they exist.
 */
const WELLNESS_EMPHASIS: EmphasisRule[] = [
  lean(QUESTION_IDS['weekly-activity'], 'low', { stretch: 4, mobility: 4 }, 'movement'),
  lean(QUESTION_IDS['weekly-activity'], 'moderate', { mobility: 1, balance: 1 }, 'movement'),
  lean(QUESTION_IDS['weekly-activity'], 'active', { strength: 2, cardio: 1 }, 'movement'),
  lean(QUESTION_IDS['session-goal'], 'relieve-tension', { 'relieve-tension': 2 }, 'goal'),
  lean(QUESTION_IDS['session-goal'], 'relieve-tension', { stretch: 1 }, 'movement'),
  lean(QUESTION_IDS['session-goal'], 'build-strength', { 'build-strength': 2 }, 'goal'),
  lean(QUESTION_IDS['session-goal'], 'build-strength', { strength: 1 }, 'movement'),
  lean(QUESTION_IDS['session-goal'], 'boost-energy', { 'boost-energy': 2 }, 'goal'),
  lean(QUESTION_IDS['session-goal'], 'boost-energy', { cardio: 1 }, 'movement'),
  lean(
    QUESTION_IDS['focus-areas'],
    'neck-shoulders',
    { shoulders: 2, 'upper-back': 1, spine: 1 },
    'body-area'
  ),
  lean(QUESTION_IDS['focus-areas'], 'lower-back-core', { 'lower-back': 2, core: 2 }, 'body-area'),
  lean(
    QUESTION_IDS['focus-areas'],
    'hips-lower-body',
    { 'hip-flexors': 2, glutes: 1, quadriceps: 1, hamstrings: 1 },
    'body-area'
  ),
];

/** The wellness flow every environment carries */
export const DEFAULT_FLOWS: SeedFlow[] = [
  {
    id: FLOW_IDS.WELLNESS,
    name: 'Wellness Movement Assessment',
    description: 'A short check-in on activity, goals and safety that sets your starting level',
    scoringConfig: { ...LEVEL_SCORING_CONFIG, emphasis: WELLNESS_EMPHASIS },
  },
];

/** A config naming a missing or mis-dimensioned question would silently drop it from scoring */
const assertScoringConfigMatchesQuestions = async (
  db: NodePgDatabase<typeof schema>,
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
 * Seeds the given assessment flows. IDEMPOTENT: an existing flow, matched by ID, is left as it
 * is, since an admin may have edited its name, description or scoring. A new flow's scoring
 * config is checked against the stored questions first, so this runs after seedQuestions.
 *
 * @returns The IDs of the flows created
 */
export const seedAssessmentFlows = async (
  db: NodePgDatabase<typeof schema>,
  flows: SeedFlow[]
): Promise<string[]> => {
  logger.info('Seeding assessment flows...');

  const created: string[] = [];

  for (const flow of flows) {
    const existingFlow = await db.query.assessmentFlows.findFirst({
      where: eq(assessmentFlows.id, flow.id),
    });

    if (existingFlow) {
      logger.warn(`Assessment flow already exists: "${flow.name}"`, { id: flow.id });
      continue;
    }

    await assertScoringConfigMatchesQuestions(db, flow.name, flow.scoringConfig);
    await db.insert(assessmentFlows).values({ ...flow, isActive: true });

    logger.info('Assessment flow created', { id: flow.id, name: flow.name });
    created.push(flow.id);
  }

  return created;
};
