import { render, screen, type RenderResult } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AnswerValue, AssessmentQuestion } from '@ffp/core';

import { QuestionRenderer } from './QuestionRenderer';

vi.mock('@web/components/video', () => ({ VideoPlayer: () => null }));

const QUESTION_ID = '3ad90ada-14f9-4883-a502-56dc6cf73ab1';
const options = [
  { value: 'calm', label: 'Calm' },
  { value: 'brisk', label: 'Brisk' },
];

const question = (
  type: AssessmentQuestion['type'],
  overrides: Partial<AssessmentQuestion> = {}
): AssessmentQuestion => ({
  id: QUESTION_ID,
  publicId: 'question0001',
  type,
  question: 'How do you feel?',
  options: type === 'single-choice' || type === 'multi-choice' ? options : undefined,
  validation: type === 'scale' ? { required: true, min: 1, max: 3 } : { required: true },
  videoId: type === 'video-response' ? '77777777-7777-7777-8777-777777770004' : undefined,
  ...overrides,
});

const renderQuestion = (
  q: AssessmentQuestion,
  error?: string,
  value: AnswerValue | null = null
): RenderResult =>
  render(<QuestionRenderer question={q} value={value} onChange={vi.fn()} error={error} />);

/** The stem every id of a question shares: its id plus the per-instance `useId` suffix. */
const stemOf = (id: string, questionId = QUESTION_ID): string => {
  const match = new RegExp(`^(question-${questionId}-:[^:]+:)`).exec(id);

  expect(match, `${id} keeps the question-<id>-<instance> stem`).not.toBeNull();

  return match?.[1] ?? '';
};

/** Each type's controls, and the element carrying the question's `aria-describedby`. */
const CASES: {
  type: AssessmentQuestion['type'];
  controls: () => HTMLElement[];
  idOf: (stem: string) => string[];
  describedElement: () => HTMLElement;
  stemQuestionId?: string;
}[] = [
  {
    type: 'single-choice',
    controls: () => screen.getAllByRole('radio'),
    idOf: (stem) => [`${stem}-option-calm`, `${stem}-option-brisk`],
    describedElement: () => screen.getByRole('group'),
  },
  {
    type: 'multi-choice',
    controls: () => screen.getAllByRole('checkbox'),
    idOf: (stem) => [`${stem}-option-calm`, `${stem}-option-brisk`],
    describedElement: () => screen.getAllByRole('group')[0],
  },
  {
    type: 'numeric',
    controls: () => [screen.getByRole('spinbutton')],
    idOf: (stem) => [stem],
    describedElement: () => screen.getByRole('spinbutton'),
  },
  {
    type: 'text',
    controls: () => [screen.getByRole('textbox')],
    idOf: (stem) => [stem],
    describedElement: () => screen.getByRole('textbox'),
  },
  {
    type: 'scale',
    controls: () => screen.getAllByRole('radio'),
    idOf: (stem) => [`${stem}-scale-1`, `${stem}-scale-2`, `${stem}-scale-3`],
    describedElement: () => screen.getByRole('group'),
  },
  {
    type: 'video-response',
    controls: () => [screen.getByRole('spinbutton')],
    idOf: (stem) => [stem],
    describedElement: () => screen.getByRole('spinbutton'),
    // Its result input is a numeric sub-question keyed `<id>-response`
    stemQuestionId: `${QUESTION_ID}-response`,
  },
];

describe('question ids and descriptions', () => {
  describe.each(CASES)('$type', ({ type, controls, idOf, describedElement, stemQuestionId }) => {
    it('keeps the generated control ids', () => {
      renderQuestion(question(type));

      const ids = controls().map((control) => control.id);
      const stem = stemOf(ids[0], stemQuestionId);

      expect(ids).toEqual(idOf(stem));
    });

    it('describes the control by its description and error, only while each exists', () => {
      const { unmount } = renderQuestion(question(type));

      expect(describedElement().getAttribute('aria-describedby')).toBeNull();
      unmount();

      // A video-response question's description sits above the video, not on its result input
      const describedByDescription = type !== 'video-response';
      const withDescription = renderQuestion(question(type, { description: 'Take your time.' }));
      const stem = stemOf(controls()[0].id, stemQuestionId);

      expect(describedElement().getAttribute('aria-describedby')).toBe(
        describedByDescription ? `${stem}-description` : null
      );
      withDescription.unmount();

      renderQuestion(question(type, { description: 'Take your time.' }), 'Choose up to 2 options.');
      const errorStem = stemOf(controls()[0].id, stemQuestionId);
      const alert = screen.getByRole('alert');

      expect(alert.textContent).toBe('Choose up to 2 options.');
      expect(alert.id).toBe(`${errorStem}-error`);
      expect(describedElement().getAttribute('aria-describedby')).toBe(
        describedByDescription
          ? `${errorStem}-description ${errorStem}-error`
          : `${errorStem}-error`
      );
    });
  });
});
