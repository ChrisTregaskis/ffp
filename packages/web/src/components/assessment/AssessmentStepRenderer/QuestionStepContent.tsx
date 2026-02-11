import { useState } from 'react';

import { LoadingSpinner } from '@web/components/LoadingSpinner';
import type { CardTransitionDirection } from '@web/components/motion';
import { FadeSlideIn } from '@web/components/motion';
import { Text } from '@web/components/text';

import { AssessmentNavigation } from '../AssessmentNavigation';
import { QuestionCard } from '../cards/QuestionCard';
import { ASSESSMENT_MOTION } from '../motion.constants';

import type { QuestionStepContentProps } from './types';

/**
 * Renders QuestionCard with intra-step navigation between questions.
 *
 * Continue/Back override AssessmentNavigation for moves between questions;
 * on the last/first question, falls through to default step-level navigation.
 */
export const QuestionStepContent: React.FC<QuestionStepContentProps> = ({
  config,
  questions,
  questionIndex,
  onQuestionIndexChange,
  answers,
  currentStep,
  onAnswer,
  isLastSubmittableStep = false,
  onSubmitAssessment,
}) => {
  const [direction, setDirection] = useState<CardTransitionDirection>('forward');

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <LoadingSpinner size="lg" variant="center" />
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Loading questions...
        </Text>
      </div>
    );
  }

  const currentQuestion = questions[questionIndex];
  const isFirstQuestion = questionIndex === 0;
  const isLastQuestion = questionIndex === questions.length - 1;
  const isFinalSubmit = isLastQuestion && isLastSubmittableStep;

  // Resolve continue handler: submit on final question, advance within step, or fall through to step navigation
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

  return (
    <div className="mx-auto max-w-3xl">
      <FadeSlideIn duration={ASSESSMENT_MOTION.duration.entrance}>
        <QuestionCard
          config={config}
          question={currentQuestion}
          questionNumber={questionIndex + 1}
          totalQuestions={questions.length}
          value={currentQuestion.id in answers ? answers[currentQuestion.id].answerValue : null}
          onAnswer={onAnswer}
          direction={direction}
          footer={
            <AssessmentNavigation
              showBack={!isFirstQuestion || currentStep > 1}
              continueLabel={isFinalSubmit ? 'Complete Assessment' : undefined}
              continueVariant={isFinalSubmit ? 'success' : undefined}
              onContinue={getContinueHandler()}
              onBack={
                isFirstQuestion
                  ? undefined
                  : () => {
                      setDirection('backward');
                      onQuestionIndexChange((i) => i - 1);
                    }
              }
            />
          }
        />
      </FadeSlideIn>
    </div>
  );
};
