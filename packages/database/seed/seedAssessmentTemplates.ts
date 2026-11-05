import { eq } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';

import { createLogger } from '../src/lib/logger.js';
import { assessmentTemplates, templateQuestions } from '../src/schema/index.js';

import { requireSeedId } from './requireSeedId.js';
import { QUESTION_IDS } from './seedQuestions.js';

import type { NewAssessmentTemplate } from '../src/schema/assessment-templates.js';
import type * as schema from '../src/schema/index.js';
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
} as const;

/** A template's questions, by question ID, in display order */
export interface TemplateQuestionMapping {
  templateId: string;
  questionIds: string[];
}

export const TEMPLATE_QUESTION_MAPPINGS: TemplateQuestionMapping[] = [
  {
    templateId: TEMPLATE_IDS.ABOUT_YOU,
    questionIds: [
      QUESTION_IDS.gender,
      QUESTION_IDS['age-bracket'],
      QUESTION_IDS['weekly-activity'],
      QUESTION_IDS['exercise-tolerance'],
      QUESTION_IDS['joint-comfort'],
    ],
  },
  {
    templateId: TEMPLATE_IDS.GOALS_AND_SAFETY,
    questionIds: [
      QUESTION_IDS['session-goal'],
      QUESTION_IDS['focus-areas'],
      QUESTION_IDS['safety-check'],
    ],
  },
];

/**
 * The wellness templates every environment carries. Questions live in the `questions` table
 * (seedQuestions.ts) and scoring lives on the flow (seedAssessmentFlows.ts).
 */
export const DEFAULT_TEMPLATES: NewAssessmentTemplate[] = [
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
];

/**
 * Seeds the given assessment templates. IDEMPOTENT: an existing template, matched by ID, is left
 * as it is, question links included, since an admin may have removed one. A new template gets
 * its links. Neither table has RLS.
 *
 * @returns The IDs of the templates created
 */
export const seedAssessmentTemplates = async (
  db: NodePgDatabase<typeof schema>,
  templates: NewAssessmentTemplate[],
  mappings: TemplateQuestionMapping[]
): Promise<string[]> => {
  logger.info('Seeding assessment templates...');

  const created: string[] = [];

  for (const template of templates) {
    const templateId = requireSeedId(template, `assessment template "${template.name}"`);

    const existingTemplate = await db.query.assessmentTemplates.findFirst({
      where: eq(assessmentTemplates.id, templateId),
    });

    if (existingTemplate) {
      logger.warn(`Template already exists: "${template.name}"`, { id: existingTemplate.id });
      continue;
    }

    await db.insert(assessmentTemplates).values(template);

    const questionIds = mappings.find((m) => m.templateId === templateId)?.questionIds ?? [];
    const links: NewTemplateQuestion[] = questionIds.map((questionId, index) => ({
      templateId,
      questionId,
      displayOrder: index + 1,
    }));

    if (links.length > 0) {
      await db.insert(templateQuestions).values(links);
    }

    logger.info('Template created', {
      name: template.name,
      id: templateId,
      questions: links.length,
    });
    created.push(templateId);
  }

  logger.info('Assessment templates seed complete', {
    created: created.length,
    alreadyExisted: templates.length - created.length,
  });

  return created;
};
