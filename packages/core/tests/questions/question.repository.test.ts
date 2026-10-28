import { randomUUID } from 'crypto';

import { eq, inArray } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import type { ScoringConfig } from '@ffp/database';
import {
  assessmentFlows,
  assessmentTemplates,
  questions,
  templateQuestions,
} from '@ffp/database/schema';
import { connectTestDb, type TestDb } from '@ffp/database/testing';

import { loadFlowQuestions } from '../../src/assessments/answer-validation';
import * as questionRepository from '../../src/questions/question.repository';
import {
  createQuestionSchema,
  updateQuestionSchema,
} from '../../src/schemas/assessment-question.schema';

import type { FlowStepWithConfig } from '../../src/assessments/flow.repository';
import type { Pool } from 'pg';

// Questions, templates and flows are shared catalogue tables: every slug and name carries a
// per-run marker, listings are searched by it, and clean-up deletes only the ids recorded here
const RUN_ID = randomUUID().slice(0, 8);

describe('Question Repository', () => {
  let pool: Pool;
  let db: TestDb;
  let createdQuestionIds: string[] = [];
  let createdTemplateIds: string[] = [];
  let createdFlowIds: string[] = [];

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
    if (createdFlowIds.length > 0) {
      await db.delete(assessmentFlows).where(inArray(assessmentFlows.id, createdFlowIds));
    }
    if (createdQuestionIds.length > 0) {
      await db.delete(questions).where(inArray(questions.id, createdQuestionIds));
    }
    createdQuestionIds = [];
    createdTemplateIds = [];
    createdFlowIds = [];
  });

  afterAll(async () => {
    await pool.end();
  });

  let slugCount = 0;

  /** A single-choice question with every nullable column set, created through the repository. */
  const createQuestion = async (
    overrides: { questionText?: string } = {}
  ): ReturnType<typeof questionRepository.createQuestion> => {
    slugCount += 1;
    const question = await questionRepository.createQuestion(
      db,
      createQuestionSchema.parse({
        slug: `question-repo-${RUN_ID}-${String(slugCount)}`,
        type: 'single-choice',
        questionText: `How steady do you feel? [${RUN_ID}]`,
        description: 'Think about the last week.',
        options: [
          { value: 'steady', label: 'Steady', score: 2 },
          { value: 'wobbly', label: 'Wobbly', score: 0 },
        ],
        validation: { required: true },
        videoId: randomUUID(),
        scoreDimension: 'balance',
        ...overrides,
      })
    );
    createdQuestionIds.push(question.id);

    return question;
  };

  const stored = async (
    questionId: string
  ): ReturnType<typeof questionRepository.findByQuestionId> =>
    await questionRepository.findByQuestionId(db, questionId);

  describe('updateQuestion', () => {
    it('leaves every column the update omits as stored', async () => {
      const question = await createQuestion();

      await questionRepository.updateQuestion(
        db,
        question.id,
        updateQuestionSchema.parse({ questionText: 'How balanced do you feel?' })
      );

      expect(await stored(question.id)).toEqual({
        ...question,
        questionText: 'How balanced do you feel?',
        updatedAt: expect.any(Date) as unknown,
      });
    });

    it('clears a nullable column on an explicit null, leaving the others', async () => {
      const question = await createQuestion();

      await questionRepository.updateQuestion(
        db,
        question.id,
        updateQuestionSchema.parse({ description: null })
      );

      expect(await stored(question.id)).toEqual({
        ...question,
        description: null,
        updatedAt: expect.any(Date) as unknown,
      });
    });
  });

  describe('findQuestionUsage', () => {
    const createFlowScoring = async (questionIds: string[]): Promise<void> => {
      const scoringConfig: ScoringConfig = {
        dimensions: [{ name: 'balance', questionIds, maxScore: 4 }],
        programmeMappings: [],
      };
      const [flow] = await db
        .insert(assessmentFlows)
        .values({ name: `Usage flow [${RUN_ID}]`, scoringConfig })
        .returning({ id: assessmentFlows.id });
      createdFlowIds.push(flow.id);
    };

    it('counts the templates assigning a question and the flows whose scoring names it', async () => {
      const question = await createQuestion();
      const [template] = await db
        .insert(assessmentTemplates)
        .values({ name: `Usage template [${RUN_ID}]` })
        .returning({ id: assessmentTemplates.id });
      createdTemplateIds.push(template.id);
      await db
        .insert(templateQuestions)
        .values({ templateId: template.id, questionId: question.id, displayOrder: 1 });
      await createFlowScoring([randomUUID(), question.id]);

      expect(await questionRepository.findQuestionUsage(db, question.id)).toEqual({
        templateCount: 1,
        scoringFlowCount: 1,
      });
    });

    it('does not count a flow whose scoring names other questions only', async () => {
      const question = await createQuestion();
      await createFlowScoring([randomUUID(), randomUUID()]);

      expect(await questionRepository.findQuestionUsage(db, question.id)).toEqual({
        templateCount: 0,
        scoringFlowCount: 0,
      });
    });
  });

  describe('a deactivated question still assigned to a template', () => {
    it('is left out of the questions validation and scoring read, like an unassigned one', async () => {
      const active = await createQuestion();
      const retired = await createQuestion();
      await db.update(questions).set({ isActive: false }).where(eq(questions.id, retired.id));
      const [template] = await db
        .insert(assessmentTemplates)
        .values({ name: `Retired question template [${RUN_ID}]` })
        .returning({ id: assessmentTemplates.id });
      createdTemplateIds.push(template.id);
      await db.insert(templateQuestions).values([
        { templateId: template.id, questionId: active.id, displayOrder: 1 },
        { templateId: template.id, questionId: retired.id, displayOrder: 2 },
      ]);
      const step: FlowStepWithConfig = {
        id: randomUUID(),
        publicId: 'flowstep0001',
        flowId: randomUUID(),
        templateId: template.id,
        order: 1,
        type: 'questions',
        config: { title: 'Questions' },
        nextStepRules: null,
        defaultNextStepId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validated = await loadFlowQuestions(db, [step]);
      const scored = await questionRepository.findByTemplateIds(db, [template.id]);

      expect([...validated.keys()]).toEqual([active.id]);
      expect(scored.map((question) => question.id)).toEqual([active.id]);
    });
  });

  describe('findQuestionPage', () => {
    it('orders rows tied on the sort column by id, so the pages neither repeat nor skip one', async () => {
      // Six questions with the same text, so only the id tie-break orders them. Without it,
      // Postgres returns ties in whatever order its sort leaves them, which can differ
      // between the queries for successive pages. They are inserted in descending id order,
      // so an untied sort (which here returns insertion order) cannot pass by chance
      const tiedText = `Tied question [${RUN_ID}]`;
      const ids = Array.from({ length: 6 }, () => randomUUID())
        .sort()
        .reverse();

      for (const [index, id] of ids.entries()) {
        await db.insert(questions).values({
          id,
          slug: `question-repo-tied-${RUN_ID}-${String(index)}`,
          type: 'text',
          questionText: tiedText,
        });
        createdQuestionIds.push(id);
      }

      const pages = [];

      for (const page of [1, 2, 3]) {
        pages.push(
          await questionRepository.findQuestionPage(
            db,
            { page, pageSize: 2, sortDirection: 'asc' },
            { search: tiedText }
          )
        );
      }

      expect(pages.flat().map((question) => question.id)).toEqual([...ids].sort());
    });

    it('falls back to question text order for a key the columns only inherit, such as constructor', async () => {
      // The text order runs against the id order, so the id tie-break alone can't pass this
      const [earlier, later] = [randomUUID(), randomUUID()].sort().reverse();

      for (const [id, questionText] of [
        [later, `Zebra crossing [${RUN_ID}]`],
        [earlier, `Apple picking [${RUN_ID}]`],
      ]) {
        await db
          .insert(questions)
          .values({ id, slug: `question-repo-${id}`, type: 'text', questionText });
        createdQuestionIds.push(id);
      }

      const listed = await questionRepository.findQuestionPage(
        db,
        { page: 1, pageSize: 10, sortBy: 'constructor', sortDirection: 'asc' },
        { search: RUN_ID }
      );

      expect(listed.map((question) => question.id)).toEqual([earlier, later]);
    });
  });
});
