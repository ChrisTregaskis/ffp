import { describe, expect, it } from 'vitest';

import { DEFAULT_FLOWS, FLOW_IDS } from '../seed/seedAssessmentFlows';
import { TEMPLATE_QUESTION_MAPPINGS } from '../seed/seedAssessmentTemplates';
import { buildExerciseCompletions } from '../seed/seedExerciseCompletions';
import { DEFAULT_FLOW_STEPS } from '../seed/seedFlowSteps';
import {
  PROGRAMME_USER_ASSESSMENT,
  PROGRAMME_USER_ASSESSMENT_ANSWERS,
} from '../seed/seedProgrammeUserAssessment';
import { PROGRAMME_IDS } from '../seed/seedProgrammeUserData';
import { DEFAULT_QUESTIONS, QUESTION_IDS } from '../seed/seedQuestions';

const STARTED_AT = new Date('2026-04-05T09:00:00Z');
const exercises = [0, 1, 2, 3].map((orderIndex) => ({
  id: `exercise-${String(orderIndex)}`,
  videoId: `video-${String(orderIndex)}`,
  orderIndex,
}));
const session = (
  status: 'not_started' | 'in_progress' | 'completed',
  startedAt: Date | null
): Parameters<typeof buildExerciseCompletions>[0] => ({
  id: 'session-1',
  organisationId: 'org-1',
  status,
  startedAt,
});

describe('Seeded exercise completions', () => {
  it('completes every exercise of a completed session, within the session', () => {
    const rows = buildExerciseCompletions(session('completed', STARTED_AT), exercises);

    expect(rows.map((row) => row.userSessionExerciseId)).toEqual(exercises.map(({ id }) => id));
    expect(rows.every((row) => row.completed)).toBe(true);
    expect(rows.every((row) => row.completedAt && row.completedAt > STARTED_AT)).toBe(true);
    expect(rows.map((row) => row.videoId)).toEqual(exercises.map(({ videoId }) => videoId));
  });

  it('leaves an in-progress session partly done, in exercise order', () => {
    const rows = buildExerciseCompletions(
      session('in_progress', STARTED_AT),
      [...exercises].reverse()
    );

    expect(rows.map((row) => [row.userSessionExerciseId, row.completed])).toEqual([
      ['exercise-0', true],
      ['exercise-1', true],
      ['exercise-2', false],
      ['exercise-3', false],
    ]);
    expect(rows.filter((row) => !row.completed).every((row) => row.completedAt === null)).toBe(
      true
    );
  });

  it('marks at least one exercise done in a short in-progress session', () => {
    const rows = buildExerciseCompletions(
      session('in_progress', STARTED_AT),
      exercises.slice(0, 1)
    );

    expect(rows.map((row) => row.completed)).toEqual([true]);
  });

  it('writes nothing for a session that has not been started', () => {
    expect(buildExerciseCompletions(session('not_started', null), exercises)).toEqual([]);
  });
});

describe('Seeded programme assessment', () => {
  const wellnessTemplateIds = DEFAULT_FLOW_STEPS.filter(
    (step) => step.flowId === FLOW_IDS.WELLNESS && step.isActive && step.templateId
  ).map((step) => step.templateId);
  const activeFlowQuestionIds = new Set<string>(
    TEMPLATE_QUESTION_MAPPINGS.filter(({ templateId }) => wellnessTemplateIds.includes(templateId))
      .flatMap(({ questionIds }) => questionIds.map((slug) => QUESTION_IDS[slug]))
      .filter((id) => DEFAULT_QUESTIONS.find((question) => question.id === id)?.isActive)
  );
  const emphasisQuestionIds = new Set(
    (DEFAULT_FLOWS.find((flow) => flow.id === FLOW_IDS.WELLNESS)?.scoringConfig.emphasis ?? []).map(
      (rule) => rule.questionId
    )
  );
  const answeredIds = PROGRAMME_USER_ASSESSMENT_ANSWERS.map((answer) => answer.questionId);

  it('is a completed Wellness assessment linked to the test programme', () => {
    expect(PROGRAMME_USER_ASSESSMENT).toMatchObject({
      flowId: FLOW_IDS.WELLNESS,
      status: 'completed',
      programmeId: PROGRAMME_IDS['test-user-active'],
    });
  });

  it('answers only the active questions on the flow’s templates', () => {
    expect(answeredIds.filter((id) => !activeFlowQuestionIds.has(id))).toEqual([]);
  });

  it('answers every question the flow’s emphasis names', () => {
    expect(emphasisQuestionIds.size).toBeGreaterThan(0);
    expect([...emphasisQuestionIds].filter((id) => !answeredIds.includes(id))).toEqual([]);
  });

  it('answers with options the questions offer', () => {
    const offPick = PROGRAMME_USER_ASSESSMENT_ANSWERS.flatMap((answer) => {
      const options = DEFAULT_QUESTIONS.find(({ id }) => id === answer.questionId)?.options ?? [];
      const values = Array.isArray(answer.answerValue)
        ? answer.answerValue
        : [String(answer.answerValue)];

      return values
        .filter((value) => !options.some((option) => option.value === value))
        .map((value) => `${answer.questionId} = ${value}`);
    });

    expect(offPick).toEqual([]);
  });

  it('gives each answer its own id and question', () => {
    expect(new Set(PROGRAMME_USER_ASSESSMENT_ANSWERS.map(({ id }) => id)).size).toBe(
      PROGRAMME_USER_ASSESSMENT_ANSWERS.length
    );
    expect(new Set(answeredIds).size).toBe(answeredIds.length);
  });
});
