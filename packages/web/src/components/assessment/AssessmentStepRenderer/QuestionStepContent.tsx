import { useEffect, useRef } from 'react';

import { validateAnswer } from '@ffp/core';

import { LoadingState } from '@web/components/molecules';
import { FadeSlideIn } from '@web/components/motion';

import { AssessmentNavigation } from '../AssessmentNavigation';
import { ASSESSMENT_MOTION } from '../motion.constants';

import { useQuestionStepNavigation } from './useQuestionStepNavigation';

import type { QuestionStepContentProps } from './types';

/**
 * Renders a question step's card (`QuestionCard`, or `VideoQuestionCard` for a video step)
 * with intra-step navigation between questions.
 *
 * Continue/Back override AssessmentNavigation for moves between questions;
 * on the last/first question, falls through to default step-level navigation.
 * Continue waits until the answer keeps the question's rules (the same check the server
 * makes); a rule broken by a value already entered shows on the question, as does any
 * message the server sent for it, and a refused question in this step is brought into view.
 */
export const QuestionStepContent: React.FC<QuestionStepContentProps> = ({
  card: QuestionCardComponent,
  config,
  questions,
  questionIndex,
  onQuestionIndexChange,
  answers,
  fieldErrors,
  refusalCount,
  currentStep,
  onAnswer,
  isLastSubmittableStep = false,
  onSubmitAssessment,
}) => {
  const currentQuestion = questions.length > 0 ? questions[questionIndex] : undefined;
  const currentValue =
    currentQuestion && currentQuestion.id in answers
      ? answers[currentQuestion.id].answerValue
      : null;
  const clientIssue = currentQuestion
    ? validateAnswer(currentQuestion, currentValue).at(0)
    : undefined;
  // The server's message first; a rule broken by what the member entered next, but not a
  // blank required answer, which only holds Continue back
  const error =
    currentQuestion && currentQuestion.id in fieldErrors
      ? fieldErrors[currentQuestion.id]
      : clientIssue && clientIssue.code !== 'required'
        ? clientIssue.message
        : undefined;

  // Read at jump time only: answering clears a question's error, and must not move the member on
  const fieldErrorsRef = useRef(fieldErrors);
  fieldErrorsRef.current = fieldErrors;

  // Once per refusal, and again when this step's questions arrive
  useEffect(() => {
    const firstRefusedIndex = questions.findIndex(
      (question) => question.id in fieldErrorsRef.current
    );

    if (firstRefusedIndex >= 0) {
      onQuestionIndexChange(firstRefusedIndex);
    }
  }, [refusalCount, questions, onQuestionIndexChange]);

  const {
    direction,
    showBack,
    continueLabel,
    continueVariant,
    continueDisabled,
    continueHandler,
    backHandler,
  } = useQuestionStepNavigation({
    questionIndex,
    totalQuestions: questions.length,
    currentStep,
    isLastSubmittableStep,
    isCurrentAnswerValid: !clientIssue,
    onSubmitAssessment,
    onQuestionIndexChange,
  });

  if (!currentQuestion) {
    return <LoadingState message="Loading questions..." />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <FadeSlideIn duration={ASSESSMENT_MOTION.duration.entrance}>
        <QuestionCardComponent
          config={config}
          question={currentQuestion}
          questionNumber={questionIndex + 1}
          totalQuestions={questions.length}
          value={currentValue}
          onAnswer={onAnswer}
          error={error}
          direction={direction}
          footer={
            <AssessmentNavigation
              showBack={showBack}
              continueLabel={continueLabel}
              continueVariant={continueVariant}
              continueDisabled={continueDisabled}
              onContinue={continueHandler}
              onBack={backHandler}
            />
          }
        />
      </FadeSlideIn>
    </div>
  );
};
