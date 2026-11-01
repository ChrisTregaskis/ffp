import type { AnswerValue } from '@ffp/database';

import { findByAssessmentId } from '../assessments/answer.repository';
import { findActiveFlowQuestions } from '../assessments/flow-question.repository';
import { findFlowById, findStepsByFlowId } from '../assessments/flow.repository';
import { findFirstAssessmentForProgramme } from '../assessments/user-assessment.repository';
import { withRLS } from '../lib/database';
import { createSystemLogger } from '../lib/logger';
import { emphasisRulesSchema, type EmphasisRule } from '../schemas/scoring-config.schema';

import type { Question } from '../questions/question.repository';
import type { ProgrammeKeyArea } from '../schemas/programme/programme.schema';

const logger = createSystemLogger('programme-key-areas');

/**
 * The answers that shaped a programme: each question its flow's emphasis rules name, with the
 * member's chosen answers from the assessment that produced it. Only the flow's questions count,
 * as in programme emphasis: a question since deactivated or unassigned shows no key area. Empty
 * when no assessment is linked or the flow's emphasis config is missing or malformed.
 */
export async function findProgrammeKeyAreas(
  organisationId: string,
  userId: string,
  programmeId: string
): Promise<ProgrammeKeyArea[]> {
  return await withRLS(organisationId, userId, async (tx) => {
    const assessment = await findFirstAssessmentForProgramme(organisationId, programmeId, { tx });

    if (!assessment) {
      return [];
    }

    const flow = await findFlowById(tx, assessment.flowId);
    const rules = emphasisRulesSchema.safeParse(flow?.scoringConfig?.emphasis ?? []);

    if (!rules.success) {
      logger.warn('Emphasis config is malformed; no key areas shown', {
        flowId: assessment.flowId,
      });

      return [];
    }

    if (rules.data.length === 0) {
      return [];
    }

    const flowQuestions = await findActiveFlowQuestions(
      tx,
      await findStepsByFlowId(tx, assessment.flowId)
    );
    const answers = await findByAssessmentId(organisationId, assessment.id, { tx });

    return resolveKeyAreas(
      rules.data,
      flowQuestions,
      new Map(answers.map((answer) => [answer.questionId, answer.answerValue]))
    );
  });
}

/**
 * One key area per question the rules name, in rule order, skipping questions the member did not
 * answer. Choice answers read as their option labels, in the question's option order.
 */
export function resolveKeyAreas(
  rules: EmphasisRule[],
  questions: Pick<Question, 'id' | 'questionText' | 'options'>[],
  answers: Map<string, AnswerValue>
): ProgrammeKeyArea[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const questionIds = [...new Set(rules.map((rule) => rule.questionId))];

  return questionIds.flatMap((questionId) => {
    const question = questionsById.get(questionId);
    const answer = answers.get(questionId);

    if (!question || answer === undefined) {
      return [];
    }

    const chosen = (Array.isArray(answer) ? answer : [String(answer)]).filter(
      (value) => value !== ''
    );
    const options = question.options ?? [];
    const optionIndex = (value: string): number => {
      const index = options.findIndex((option) => option.value === value);

      return index === -1 ? options.length : index;
    };
    const labels = [...chosen]
      .sort((a, b) => optionIndex(a) - optionIndex(b))
      .map((value) => options.find((option) => option.value === value)?.label ?? value);

    return labels.length > 0
      ? [{ questionId, question: question.questionText, answers: labels }]
      : [];
  });
}
