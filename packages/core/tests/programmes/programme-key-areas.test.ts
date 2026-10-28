import { randomUUID } from 'crypto';

import { describe, it, expect } from 'vitest';

import type { AnswerValue, EmphasisRule } from '@ffp/database';
import { selectQuestionSchema } from '@ffp/database/schema';

import { resolveKeyAreas } from '../../src/programmes/programme-key-areas';

import type { Question } from '../../src/questions/question.repository';

const question = (
  questionText: string,
  options: { value: string; label: string }[] | null
): Question =>
  selectQuestionSchema.parse({
    id: randomUUID(),
    publicId: 'abcdefghijkl',
    slug: `slug-${randomUUID()}`,
    type: options ? 'single-choice' : 'scale',
    questionText,
    description: null,
    options,
    validation: null,
    videoId: null,
    scoreDimension: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const rule = (questionId: string, answerValue: string): EmphasisRule => ({
  questionId,
  answerValue,
  tags: [{ category: 'movement', slug: 'stretch', weight: 1 }],
});

describe('resolveKeyAreas', () => {
  const focus = question('Which areas?', [
    { value: 'neck', label: 'Neck' },
    { value: 'back', label: 'Back' },
    { value: 'hips', label: 'Hips' },
  ]);
  const goal = question('Your goal?', [
    { value: 'calm', label: 'Feel calmer' },
    { value: 'strong', label: 'Get stronger' },
  ]);

  it('reads choice answers as option labels, in option order, once per question in rule order', () => {
    const answers = new Map<string, AnswerValue>([
      [goal.id, 'strong'],
      [focus.id, ['hips', 'neck']],
    ]);

    expect(
      resolveKeyAreas(
        [rule(focus.id, 'neck'), rule(goal.id, 'calm'), rule(focus.id, 'hips')],
        [goal, focus],
        answers
      )
    ).toEqual([
      { questionId: focus.id, question: 'Which areas?', answers: ['Neck', 'Hips'] },
      { questionId: goal.id, question: 'Your goal?', answers: ['Get stronger'] },
    ]);
  });

  it('skips a named question the member did not answer, or chose nothing for', () => {
    const answers = new Map<string, AnswerValue>([
      [focus.id, []],
      [goal.id, ''],
    ]);

    expect(
      resolveKeyAreas([rule(goal.id, 'calm'), rule(focus.id, 'neck')], [goal, focus], answers)
    ).toEqual([]);
  });

  it('shows an answer with no matching option as its value', () => {
    const effort = question('Effort today?', null);
    const answers = new Map<string, AnswerValue>([[effort.id, 7]]);

    expect(resolveKeyAreas([rule(effort.id, '7')], [effort], answers)).toEqual([
      { questionId: effort.id, question: 'Effort today?', answers: ['7'] },
    ]);
  });
});
