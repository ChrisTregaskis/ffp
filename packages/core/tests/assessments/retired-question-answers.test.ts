import { randomUUID } from 'crypto';

import { eq, inArray, sql } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  assessmentFlows,
  assessmentSafetyTriggers,
  assessmentTemplates,
  flowSteps,
  questions,
  tagCategories,
  tags,
  templateQuestions,
  userAssessmentAnswers,
  userAssessments,
} from '@ffp/database/schema';
import {
  asOrganisation,
  connectTestDb,
  deleteOrganisations,
  type TestDb,
} from '@ffp/database/testing';

import * as assessmentService from '../../src/assessments/assessment.service';
import { closePool, withRLS } from '../../src/lib/database';
import { findEmphasisWeights } from '../../src/programmes/programme-emphasis';

import type { OrganisationContext, UserActor } from '../../src/lib/context';
import type { EmphasisWeights } from '../../src/programmes/assembly';
import type { Pool } from 'pg';

// Questions, templates, flows and tags are shared catalogue tables: names carry a per-run
// marker, and clean-up deletes only the rows this test created
const RUN_ID = randomUUID().slice(0, 8);
const ADVICE = 'Please speak to a health professional before you start.';
const EMPHASIS_WEIGHT = 5;

interface Answered {
  organisationId: string;
  assessmentId: string;
  context: OrganisationContext;
  retiredSlug: string;
  emphasisedTag: string;
}

const shortId = (): string => randomUUID().replace(/-/g, '').slice(0, 12);

describe('Answers to a question the flow no longer counts', () => {
  let pool: Pool;
  let db: TestDb;
  const organisationIds: string[] = [];
  const flowIds: string[] = [];
  const templateIds: string[] = [];
  const questionIds: string[] = [];
  const tagIds: string[] = [];

  beforeAll(() => {
    ({ pool, db } = connectTestDb());
  });

  afterEach(async () => {
    // The organisation takes its member, assessments, answers, triggers and jobs with it; the
    // flow its steps, and the template its question links
    await deleteOrganisations(db, organisationIds.splice(0));
    await db.delete(assessmentFlows).where(inArray(assessmentFlows.id, flowIds.splice(0)));
    await db
      .delete(assessmentTemplates)
      .where(inArray(assessmentTemplates.id, templateIds.splice(0)));
    await db.delete(questions).where(inArray(questions.id, questionIds.splice(0)));
    await db.delete(tags).where(inArray(tags.id, tagIds.splice(0)));
  });

  afterAll(async () => {
    await pool.end();
    await closePool();
  });

  /**
   * A member part-way through a flow with one question step, who has answered a counted
   * question "no" and a second question "yes". That "yes" raises the flow's safety advice and is
   * named by its emphasis rule. With `retire`, the second question is deactivated after it was
   * answered.
   */
  const setUp = async ({ retire }: { retire: boolean }): Promise<Answered> => {
    const options = ['yes', 'no'].map((value) => ({ value, label: value }));
    const retiredSlug = `retired-answer-${shortId()}`;
    const [counted, retired] = await db
      .insert(questions)
      .values([
        {
          slug: `counted-answer-${shortId()}`,
          type: 'single-choice',
          questionText: 'Counted?',
          options,
        },
        { slug: retiredSlug, type: 'single-choice', questionText: 'Retired?', options },
      ])
      .returning({ id: questions.id });
    questionIds.push(counted.id, retired.id);

    const [template] = await db
      .insert(assessmentTemplates)
      .values({ name: `Retired answer template [${RUN_ID}]` })
      .returning({ id: assessmentTemplates.id });
    templateIds.push(template.id);
    await db.insert(templateQuestions).values([
      { templateId: template.id, questionId: counted.id, displayOrder: 1 },
      { templateId: template.id, questionId: retired.id, displayOrder: 2 },
    ]);

    const [movement] = await db
      .select({ id: tagCategories.id })
      .from(tagCategories)
      .where(eq(tagCategories.slug, 'movement'));
    const tagSlug = `retired-answer-${shortId()}`;
    const [tag] = await db
      .insert(tags)
      .values({ categoryId: movement.id, slug: tagSlug, label: tagSlug })
      .returning({ id: tags.id });
    tagIds.push(tag.id);

    const [flow] = await db
      .insert(assessmentFlows)
      .values({
        name: `Retired answer flow [${RUN_ID}]`,
        scoringConfig: {
          dimensions: [],
          programmeMappings: [],
          emphasis: [
            {
              questionId: retired.id,
              answerValue: 'yes',
              tags: [{ category: 'movement', slug: tagSlug, weight: EMPHASIS_WEIGHT }],
            },
          ],
        },
      })
      .returning({ id: assessmentFlows.id });
    flowIds.push(flow.id);
    await db.insert(flowSteps).values([
      {
        flowId: flow.id,
        order: 1,
        type: 'questions',
        templateId: template.id,
        config: { title: 'Questions' },
        nextStepRules: [
          {
            priority: 1,
            conditions: [{ type: 'answer_value', questionSlug: retiredSlug, answerValue: 'yes' }],
            action: {
              type: 'show_warning',
              warningMessage: ADVICE,
              warningType: 'seek_medical',
              continueAfterWarning: true,
            },
          },
        ],
      },
      { flowId: flow.id, order: 2, type: 'results', config: { title: 'Results' } },
    ]);

    const organisationId = randomUUID();
    const userId = randomUUID();
    const cognitoSub = `cognito-${shortId()}`;
    organisationIds.push(organisationId);

    const assessmentId = await asOrganisation(db, organisationId, async (tx) => {
      await tx.execute(sql`
        INSERT INTO organisations (id, public_id, type, name, settings)
        VALUES (${organisationId}, ${shortId()}, 'individual', ${`Retired answer organisation [${RUN_ID}]`}, '{}')
      `);
      await tx.execute(sql`
        INSERT INTO users (id, public_id, organisation_id, location_id, email, cognito_sub, first_name, last_name, role)
        VALUES (${userId}, ${shortId()}, ${organisationId}, NULL, ${`retired-${shortId()}@test.com`}, ${cognitoSub}, 'Mo', 'Member', 'programme_user')
      `);
      const [assessment] = await tx
        .insert(userAssessments)
        .values({ organisationId, userId, flowId: flow.id, currentStep: 1, status: 'in_progress' })
        .returning({ id: userAssessments.id });
      await tx.insert(userAssessmentAnswers).values([
        {
          organisationId,
          userAssessmentId: assessment.id,
          questionId: counted.id,
          answerValue: 'no',
        },
        {
          organisationId,
          userAssessmentId: assessment.id,
          questionId: retired.id,
          answerValue: 'yes',
        },
      ]);

      return assessment.id;
    });

    if (retire) {
      await db.update(questions).set({ isActive: false }).where(eq(questions.id, retired.id));
    }

    return {
      organisationId,
      assessmentId,
      retiredSlug,
      emphasisedTag: `movement:${tagSlug}`,
      context: {
        actor: { type: 'user', userId: cognitoSub, userRole: 'programme_user' } as UserActor,
        organisationId,
        locationId: randomUUID(),
        requestId: randomUUID(),
        timestamp: new Date(),
      },
    };
  };

  const emphasisOf = ({ organisationId, assessmentId }: Answered): Promise<EmphasisWeights> =>
    withRLS(organisationId, undefined, (tx) =>
      findEmphasisWeights(tx, organisationId, assessmentId)
    );

  describe('programme emphasis', () => {
    it('is weighted by an answer to a question the flow still counts', async () => {
      const answered = await setUp({ retire: false });

      expect(await emphasisOf(answered)).toEqual(
        new Map([[answered.emphasisedTag, EMPHASIS_WEIGHT]])
      );
    });

    it('ignores an answer to a question since deactivated', async () => {
      const answered = await setUp({ retire: true });

      expect(await emphasisOf(answered)).toEqual(new Map());
    });
  });

  describe('the safety gate', () => {
    it('still sees an answer to a question since deactivated, and holds the result for it', async () => {
      const answered = await setUp({ retire: true });

      await assessmentService.submitAssessment(
        answered.assessmentId,
        { answers: {} },
        answered.context
      );

      const triggers = await asOrganisation(db, answered.organisationId, (tx) =>
        tx
          .select({
            questionSlug: assessmentSafetyTriggers.questionSlug,
            selectedOptions: assessmentSafetyTriggers.selectedOptions,
            warningMessage: assessmentSafetyTriggers.warningMessage,
          })
          .from(assessmentSafetyTriggers)
          .where(eq(assessmentSafetyTriggers.userAssessmentId, answered.assessmentId))
      );

      expect(triggers).toEqual([
        { questionSlug: answered.retiredSlug, selectedOptions: ['yes'], warningMessage: ADVICE },
      ]);
    });
  });
});
