import { randomUUID } from 'crypto';

import { eq, inArray } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { assessmentTemplates, questions, templateQuestions } from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import { findActiveFlowQuestions } from '../../src/assessments/flow-question.repository';
import * as questionRepository from '../../src/questions/question.repository';
import { createQuestionSchema } from '../../src/schemas/assessment-question.schema';

import type { FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { Pool } from 'pg';

// Questions and templates are shared catalogue tables: every slug and name carries a per-run
// marker, and clean-up deletes only the ids recorded here
const RUN_ID = randomUUID().slice(0, 8);

describe('findActiveFlowQuestions', () => {
  let pool: Pool;
  let db: TestDb;
  let createdQuestionIds: string[] = [];
  let createdTemplateIds: string[] = [];

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterEach(async () => {
    // FK order: template_questions → templates, then the questions they named
    if (createdTemplateIds.length > 0) {
      await db
        .delete(templateQuestions)
        .where(inArray(templateQuestions.templateId, createdTemplateIds));
      await db
        .delete(assessmentTemplates)
        .where(inArray(assessmentTemplates.id, createdTemplateIds));
    }
    if (createdQuestionIds.length > 0) {
      await db.delete(questions).where(inArray(questions.id, createdQuestionIds));
    }
    createdQuestionIds = [];
    createdTemplateIds = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  let slugCount = 0;

  const createQuestion = async (): Promise<string> => {
    slugCount += 1;
    const question = await questionRepository.createQuestion(
      db,
      createQuestionSchema.parse({
        slug: `flow-question-repo-${RUN_ID}-${String(slugCount)}`,
        type: 'text',
        questionText: `What would you like to work on? [${RUN_ID}]`,
      })
    );
    createdQuestionIds.push(question.id);

    return question.id;
  };

  /** A template showing the given questions, in the order given. */
  const createTemplate = async (questionIds: string[]): Promise<string> => {
    const [template] = await db
      .insert(assessmentTemplates)
      .values({ name: `Flow question template [${RUN_ID}]` })
      .returning({ id: assessmentTemplates.id });
    createdTemplateIds.push(template.id);

    if (questionIds.length > 0) {
      await db.insert(templateQuestions).values(
        questionIds.map((questionId, index) => ({
          templateId: template.id,
          questionId,
          displayOrder: index + 1,
        }))
      );
    }

    return template.id;
  };

  const step = (
    type: FlowStepWithConfig['type'],
    templateId: string | null,
    order: number
  ): FlowStepWithConfig => ({
    id: randomUUID(),
    publicId: 'flowstep0001',
    flowId: randomUUID(),
    templateId,
    order,
    type,
    config: { title: type },
    nextStepRules: null,
    defaultNextStepId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const byTemplateId = <T extends { templateId: string }>(rows: T[]): T[] =>
    [...rows].sort((a, b) => (a.templateId < b.templateId ? -1 : 1));

  it('reads the active questions on the templates of question and video steps only', async () => {
    const asked = await createQuestion();
    const retired = await createQuestion();
    const filmed = await createQuestion();
    const onIntro = await createQuestion();
    await createQuestion();
    await db.update(questions).set({ isActive: false }).where(eq(questions.id, retired));
    const questionTemplate = await createTemplate([asked, retired]);
    const videoTemplate = await createTemplate([filmed]);
    const introTemplate = await createTemplate([onIntro]);

    const rows = await findActiveFlowQuestions(db, [
      step('intro', introTemplate, 1),
      step('questions', questionTemplate, 2),
      step('video-assessment', videoTemplate, 3),
      step('results', null, 4),
    ]);

    expect(rows.map(({ id, templateId }) => ({ id, templateId }))).toEqual(
      byTemplateId([
        { id: asked, templateId: questionTemplate },
        { id: filmed, templateId: videoTemplate },
      ])
    );
  });

  it('returns a question two of the flow’s templates show once for each, in display order', async () => {
    const shared = await createQuestion();
    const firstOnly = await createQuestion();
    const first = await createTemplate([firstOnly, shared]);
    const second = await createTemplate([shared]);

    const rows = await findActiveFlowQuestions(db, [
      step('questions', first, 1),
      step('questions', second, 2),
      step('questions', first, 3),
    ]);

    const expected =
      first < second
        ? [
            { id: firstOnly, templateId: first, displayOrder: 1 },
            { id: shared, templateId: first, displayOrder: 2 },
            { id: shared, templateId: second, displayOrder: 1 },
          ]
        : [
            { id: shared, templateId: second, displayOrder: 1 },
            { id: firstOnly, templateId: first, displayOrder: 1 },
            { id: shared, templateId: first, displayOrder: 2 },
          ];
    expect(
      rows.map(({ id, templateId, displayOrder }) => ({ id, templateId, displayOrder }))
    ).toEqual(expected);
  });
});
