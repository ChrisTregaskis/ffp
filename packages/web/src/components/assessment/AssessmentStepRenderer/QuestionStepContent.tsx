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
 */
export const QuestionStepContent: React.FC<QuestionStepContentProps> = ({
  card: QuestionCardComponent,
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
  const currentQuestion = questions.length > 0 ? questions[questionIndex] : undefined;
  const isCurrentQuestionRequired = currentQuestion?.validation?.required !== false;
  const isCurrentQuestionAnswered = !!currentQuestion && currentQuestion.id in answers;

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
    isCurrentQuestionRequired,
    isCurrentQuestionAnswered,
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
          value={currentQuestion.id in answers ? answers[currentQuestion.id].answerValue : null}
          onAnswer={onAnswer}
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
