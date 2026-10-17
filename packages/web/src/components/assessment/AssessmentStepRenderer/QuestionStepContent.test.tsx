import { fireEvent, render, screen, type RenderResult } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnswerValue, AssessmentQuestion } from '@ffp/core';

import { createInitialState } from '@web/contexts/assessments/helpers';

import { QuestionCard } from '../cards/QuestionCard';

import { QuestionStepContent } from './QuestionStepContent';

import type { ReactElement } from 'react';

const navigation = vi.hoisted(() => ({
  assessmentId: null as string | null,
  isDirty: false,
  mutateAsync: vi.fn(),
}));

vi.mock('@web/contexts/assessments/useAssessment', () => ({
  useAssessment: () => ({
    assessmentState: {
      ...createInitialState('flow-1'),
      assessmentId: navigation.assessmentId,
      isDirty: navigation.isDirty,
      currentStep: 2,
    },
    assessmentDispatch: vi.fn(),
  }),
}));
vi.mock('@web/hooks/assessments/useShowRefusedAnswers', () => ({
  useShowRefusedAnswers: () => vi.fn(),
}));
vi.mock('@web/hooks/assessments/useSaveProgress', () => ({
  useSaveProgress: () => ({ mutateAsync: navigation.mutateAsync, isPending: false }),
}));

const focus: AssessmentQuestion = {
  id: '3ad90ada-14f9-4883-a502-56dc6cf73ab1',
  publicId: 'question0001',
  type: 'multi-choice',
  question: 'Which areas would you like to focus on?',
  options: [
    { value: 'neck', label: 'Neck and shoulders' },
    { value: 'back', label: 'Lower back' },
  ],
  validation: { required: true, maxSelections: 2 },
};

const goal: AssessmentQuestion = {
  id: '5b22a43f-5827-4a1b-9c0d-1e2f3a4b5c6d',
  publicId: 'question0002',
  type: 'single-choice',
  question: 'What is your main goal?',
  options: [
    { value: 'move', label: 'Move more easily' },
    { value: 'strength', label: 'Build strength' },
  ],
  validation: { required: true },
};

interface StepOptions {
  answers?: Record<string, AnswerValue>;
  fieldErrors?: Record<string, string>;
  refusalCount?: number;
  questionIndex?: number;
  onQuestionIndexChange?: (index: number | ((prev: number) => number)) => void;
  isLastSubmittableStep?: boolean;
  onSubmitAssessment?: () => void;
}

const questions = [focus, goal];

const step = ({
  answers = {},
  fieldErrors = {},
  refusalCount = 0,
  questionIndex = 0,
  onQuestionIndexChange = vi.fn(),
  isLastSubmittableStep = false,
  onSubmitAssessment,
}: StepOptions): ReactElement => (
  <QuestionStepContent
    card={QuestionCard}
    config={{ title: 'Your goals' }}
    questions={questions}
    questionIndex={questionIndex}
    onQuestionIndexChange={onQuestionIndexChange}
    answers={Object.fromEntries(
      Object.entries(answers).map(([questionId, answerValue]) => [
        questionId,
        { questionId, answerValue },
      ])
    )}
    fieldErrors={fieldErrors}
    refusalCount={refusalCount}
    currentStep={2}
    onAnswer={vi.fn()}
    isLastSubmittableStep={isLastSubmittableStep}
    onSubmitAssessment={onSubmitAssessment}
  />
);

const renderStep = (options: StepOptions): RenderResult => render(step(options));

const continueButton = (): HTMLButtonElement => screen.getByRole('button', { name: /Continue/ });

describe('QuestionStepContent', () => {
  it('does not count an emptied selection as an answer', () => {
    renderStep({ answers: { [focus.id]: [] } });

    expect(continueButton().disabled).toBe(true);
  });

  it('lets the member continue once the answer keeps its rules', () => {
    renderStep({ answers: { [focus.id]: ['neck'] } });

    expect(continueButton().disabled).toBe(false);
  });

  it('shows the server’s message on the question it names, not on its neighbour', () => {
    const message = 'Choose up to 2 options.';
    const { unmount } = renderStep({
      answers: { [focus.id]: ['neck'] },
      fieldErrors: { [focus.id]: message },
    });

    expect(screen.getByRole('alert').textContent).toBe(message);
    unmount();

    renderStep({
      answers: { [focus.id]: ['neck'] },
      fieldErrors: { [goal.id]: 'Choose one of the options shown.' },
    });

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('brings a refused question in the step into view', () => {
    const onQuestionIndexChange = vi.fn();

    renderStep({
      answers: { [focus.id]: ['neck'], [goal.id]: 'move' },
      fieldErrors: { [focus.id]: 'Choose up to 2 options.' },
      questionIndex: 1,
      onQuestionIndexChange,
    });

    expect(onQuestionIndexChange).toHaveBeenCalledWith(0);
  });

  it('does not move the member on when they fix the first of two refused questions', () => {
    const onQuestionIndexChange = vi.fn();
    const refused = {
      [focus.id]: 'Please answer this question.',
      [goal.id]: 'Please answer this question.',
    };
    const { rerender } = renderStep({
      fieldErrors: refused,
      refusalCount: 1,
      onQuestionIndexChange,
    });

    expect(onQuestionIndexChange).toHaveBeenLastCalledWith(0);
    onQuestionIndexChange.mockClear();

    rerender(
      step({
        answers: { [focus.id]: ['neck'] },
        fieldErrors: { [goal.id]: 'Please answer this question.' },
        refusalCount: 1,
        onQuestionIndexChange,
      })
    );

    expect(onQuestionIndexChange).not.toHaveBeenCalled();
  });

  describe('saving the position', () => {
    const answered = { [focus.id]: ['neck'], [goal.id]: 'move' };
    const savedPayloads = (): unknown[] =>
      navigation.mutateAsync.mock.calls.map(([input]) => (input as { payload: unknown }).payload);

    beforeEach(() => {
      navigation.assessmentId = 'assessment-1';
      navigation.isDirty = true;
      navigation.mutateAsync.mockReset().mockResolvedValue({ nextStepId: null });
    });

    it('keeps the position on the step for a move between its questions', () => {
      renderStep({ answers: answered, questionIndex: 0 });

      fireEvent.click(continueButton());

      expect(savedPayloads()).toEqual([expect.not.objectContaining({ advance: true })]);
    });

    it('advances the position when Continue leaves the step', () => {
      renderStep({ answers: answered, questionIndex: 1 });

      fireEvent.click(continueButton());

      expect(savedPayloads()).toEqual([expect.objectContaining({ advance: true })]);
    });

    it('does not advance the position when Back leaves the step', () => {
      renderStep({ answers: answered, questionIndex: 0 });

      fireEvent.click(screen.getByRole('button', { name: /Back/ }));

      expect(savedPayloads()).toEqual([expect.objectContaining({ advance: false })]);
    });

    it('submits without a save racing it', () => {
      const onSubmitAssessment = vi.fn();

      renderStep({
        answers: answered,
        questionIndex: 1,
        isLastSubmittableStep: true,
        onSubmitAssessment,
      });

      fireEvent.click(screen.getByRole('button', { name: /Complete Assessment/ }));

      expect(onSubmitAssessment).toHaveBeenCalledTimes(1);
      expect(navigation.mutateAsync).not.toHaveBeenCalled();
    });
  });
});
