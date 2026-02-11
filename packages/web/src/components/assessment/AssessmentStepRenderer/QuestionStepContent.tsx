import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { FadeSlideIn } from '@web/components/motion';
import { Text } from '@web/components/text';

import { AssessmentNavigation } from '../AssessmentNavigation';
import { QuestionCard } from '../cards/QuestionCard';
import { ASSESSMENT_MOTION } from '../motion.constants';

import { useQuestionStepNavigation } from './useQuestionStepNavigation';

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
  const { direction, showBack, continueLabel, continueVariant, continueHandler, backHandler } =
    useQuestionStepNavigation({
      questionIndex,
      totalQuestions: questions.length,
      currentStep,
      isLastSubmittableStep,
      onSubmitAssessment,
      onQuestionIndexChange,
    });

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
              showBack={showBack}
              continueLabel={continueLabel}
              continueVariant={continueVariant}
              onContinue={continueHandler}
              onBack={backHandler}
            />
          }
        />
      </FadeSlideIn>
    </div>
  );
};
