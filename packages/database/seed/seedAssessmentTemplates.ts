import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { assessmentTemplates, templateQuestions } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { QUESTION_IDS } from './seedQuestions.js'; // Used for template-question mappings

import type { NewAssessmentTemplate } from '../src/schema/assessment-templates.js';
import type { NewTemplateQuestion } from '../src/schema/template-questions.js';

const logger = createLogger('seed-assessment-templates');

/**
 * Deterministic UUIDs for assessment templates
 * These are fixed to ensure consistency across seed runs and allow
 * assessment_flows to reference them reliably.
 */
export const TEMPLATE_IDS = {
  ABOUT_YOU: '11111111-1111-1111-8111-111111111106',
  GOALS_AND_SAFETY: '11111111-1111-1111-8111-111111111107',
  GETTING_STARTED: '11111111-1111-1111-8111-111111111101',
  STRENGTH_CHECK: '11111111-1111-1111-8111-111111111102',
  BALANCE_CHECK: '11111111-1111-1111-8111-111111111103',
} as const;

/**
 * Template question mappings
 * Maps each template to its questions with display order
 */
interface TemplateQuestionMapping {
  templateId: string;
  questionIds: Array<keyof typeof QUESTION_IDS>;
}

const templateQuestionMappings: TemplateQuestionMapping[] = [
  {
    templateId: TEMPLATE_IDS.ABOUT_YOU,
    questionIds: [
      'gender',
      'age-bracket',
      'weekly-activity',
      'exercise-tolerance',
      'joint-comfort',
    ],
  },
  {
    templateId: TEMPLATE_IDS.GOALS_AND_SAFETY,
    questionIds: ['session-goal', 'focus-areas', 'safety-check'],
  },
  {
    templateId: TEMPLATE_IDS.GETTING_STARTED,
    questionIds: ['activity-level', 'check-focus'],
  },
  {
    templateId: TEMPLATE_IDS.STRENGTH_CHECK,
    questionIds: ['squat-assessment', 'squat-rating'],
  },
  {
    templateId: TEMPLATE_IDS.BALANCE_CHECK,
    questionIds: ['single-leg-stand', 'single-leg-duration'],
  },
];

/**
 * All default templates to seed. Questions live in the `questions` table
 * (seedQuestions.ts) and scoring lives on the flow (seedAssessmentFlows.ts).
 */
const DEFAULT_TEMPLATES: NewAssessmentTemplate[] = [
  {
    id: TEMPLATE_IDS.ABOUT_YOU,
    name: 'about-you-v1',
    description: 'Age, gender and everyday activity, which set the starting level',
    version: 1,
    isActive: true,
  },
  {
    id: TEMPLATE_IDS.GOALS_AND_SAFETY,
    name: 'goals-and-safety-v1',
    description: 'Session goal, focus areas and a safety check',
    version: 1,
    isActive: true,
  },
  {
    id: TEMPLATE_IDS.GETTING_STARTED,
    name: 'getting-started-v1',
    description: 'Activity level and which movement check to start with',
    version: 1,
    isActive: true,
  },
  {
    id: TEMPLATE_IDS.STRENGTH_CHECK,
    name: 'strength-check-v1',
    description: 'Video-guided strength check',
    version: 1,
    isActive: true,
  },
  {
    id: TEMPLATE_IDS.BALANCE_CHECK,
    name: 'balance-check-v1',
    description: 'Video-guided balance check',
    version: 1,
    isActive: true,
  },
];

/**
 * Seeds template_questions join records for a template
 *
 * @param db - Database client
 * @param templateId - Template UUID
 * @param questionSlugs - Ordered array of question slugs
 * @returns Number of join records created
 */
const seedTemplateQuestions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  templateId: string,
  questionSlugs: Array<keyof typeof QUESTION_IDS>
): Promise<number> => {
  let createdCount = 0;

  for (let i = 0; i < questionSlugs.length; i++) {
    const slug = questionSlugs[i];
    const questionId = QUESTION_IDS[slug];
    const displayOrder = i + 1; // 1-based display order

    // Check if join record already exists
    const existing = await db.query.templateQuestions.findFirst({
      where: (tq, { and, eq }) => and(eq(tq.templateId, templateId), eq(tq.questionId, questionId)),
    });

    if (existing) {
      continue; // Already exists, skip
    }

    const joinRecord: NewTemplateQuestion = {
      templateId,
      questionId,
      displayOrder,
    };

    await db.insert(templateQuestions).values(joinRecord);
    createdCount++;
  }

  return createdCount;
};

/**
 * Seeds assessment templates for MVP.
 *
 * This seed is IDEMPOTENT - safe to run multiple times.
 * Templates are upserted by ID (existing templates are skipped).
 *
 * Note: assessment_templates table has NO RLS, so no special context needed.
 *
 * @param db - Database client with schema
 * @returns Promise<number> - Number of templates created (0 if all existed)
 */
export const seedAssessmentTemplates = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool }
): Promise<number> => {
  logger.info('Seeding assessment templates...');

  let templatesCreatedCount = 0;
  let joinRecordsCreatedCount = 0;

  for (const template of DEFAULT_TEMPLATES) {
    // Check if template already exists (idempotency check by ID)
    const existingTemplate = await db.query.assessmentTemplates.findFirst({
      where: eq(assessmentTemplates.id, template.id!),
    });

    // Get question count from template-question mappings
    const mapping = templateQuestionMappings.find((m) => m.templateId === template.id);
    const questionCount = mapping?.questionIds.length ?? 0;

    if (existingTemplate) {
      logger.warn(`Template already exists: "${template.name}"`, { id: existingTemplate.id });
    } else {
      // Insert new template
      const [newTemplate] = await db.insert(assessmentTemplates).values(template).returning({
        id: assessmentTemplates.id,
        name: assessmentTemplates.name,
      });

      logger.info('Template created', {
        name: newTemplate.name,
        id: newTemplate.id,
        questionCount,
      });

      templatesCreatedCount++;
    }

    // Seed template_questions join records (always attempt, idempotent)
    if (mapping) {
      const joinCount = await seedTemplateQuestions(db, template.id!, mapping.questionIds);
      if (joinCount > 0) {
        logger.debug('Template-question joins created', { templateId: template.id, joinCount });
        joinRecordsCreatedCount += joinCount;
      }
    }
  }

  logger.info('Assessment templates seed complete', {
    templatesCreated: templatesCreatedCount,
    joinsCreated: joinRecordsCreatedCount,
  });

  return templatesCreatedCount;
};
