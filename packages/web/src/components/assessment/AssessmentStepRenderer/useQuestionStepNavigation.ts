import { useState } from 'react';

import type { ButtonVariant } from '@web/components/button';
import type { CardTransitionDirection } from '@web/components/motion';

interface UseQuestionStepNavigationParams {
  questionIndex: number;
  totalQuestions: number;
  currentStep: number;
  isLastSubmittableStep: boolean;
  /** Whether the current question requires an answer */
  isCurrentQuestionRequired: boolean;
  /** Whether the current question has been answered */
  isCurrentQuestionAnswered: boolean;
  onSubmitAssessment?: () => void;
  onQuestionIndexChange: (index: number | ((prev: number) => number)) => void;
}

interface QuestionStepNavigation {
  direction: CardTransitionDirection;
  showBack: boolean;
  continueLabel: string | undefined;
  continueVariant: ButtonVariant | undefined;
  continueDisabled: boolean;
  continueHandler: (() => void) | undefined;
  backHandler: (() => void) | undefined;
}

/**
 * Shared navigation logic for question and video step content.
 *
 * Computes continue/back handlers with intra-step question advancement,
 * final-submit detection, and derived button label/variant.
 */
export const useQuestionStepNavigation = ({
  questionIndex,
  totalQuestions,
  currentStep,
  isLastSubmittableStep,
  isCurrentQuestionRequired,
  isCurrentQuestionAnswered,
  onSubmitAssessment,
  onQuestionIndexChange,
}: UseQuestionStepNavigationParams): QuestionStepNavigation => {
  const [direction, setDirection] = useState<CardTransitionDirection>('forward');

  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const isFinalSubmit = isLastQuestion && isLastSubmittableStep;

  const getContinueHandler = (): (() => void) | undefined => {
    if (isFinalSubmit) {
      return () => onSubmitAssessment?.();
    }

    if (isLastQuestion) {
      return undefined;
    }

    return () => {
      setDirection('forward');
      onQuestionIndexChange((i) => i + 1);
    };
  };

  const getBackHandler = (): (() => void) | undefined => {
    if (isFirstQuestion) {
      return undefined;
    }

    return () => {
      setDirection('backward');
      onQuestionIndexChange((i) => i - 1);
    };
  };

  // Disable Continue when a required question has no answer
  const continueDisabled = isCurrentQuestionRequired && !isCurrentQuestionAnswered;

  return {
    direction,
    showBack: !isFirstQuestion || currentStep > 1,
    continueLabel: isFinalSubmit ? 'Complete Assessment' : undefined,
    continueVariant: isFinalSubmit ? 'success' : undefined,
    continueDisabled,
    continueHandler: getContinueHandler(),
    backHandler: getBackHandler(),
  };
};
