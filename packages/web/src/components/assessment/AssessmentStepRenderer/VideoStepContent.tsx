import { LoadingSpinner } from '@web/components/LoadingSpinner';
import { FadeSlideIn } from '@web/components/motion';
import { Text } from '@web/components/text';

import { AssessmentNavigation } from '../AssessmentNavigation';
import { VideoQuestionCard } from '../cards/VideoQuestionCard';
import { ASSESSMENT_MOTION } from '../motion.constants';

import { useQuestionStepNavigation } from './useQuestionStepNavigation';

import type { QuestionStepContentProps } from './types';

/** Same navigation logic as QuestionStepContent, rendering VideoQuestionCard. */
export const VideoStepContent: React.FC<QuestionStepContentProps> = ({
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
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <LoadingSpinner size="lg" variant="center" />
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          Loading questions...
        </Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <FadeSlideIn duration={ASSESSMENT_MOTION.duration.entrance}>
        <VideoQuestionCard
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
