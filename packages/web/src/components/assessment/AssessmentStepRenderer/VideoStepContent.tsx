import { useState } from 'react';

import { LoadingSpinner } from '@web/components/LoadingSpinner';
import type { CardTransitionDirection } from '@web/components/motion';
import { FadeSlideIn } from '@web/components/motion';
import { Text } from '@web/components/text';

import { AssessmentNavigation } from '../AssessmentNavigation';
import { VideoQuestionCard } from '../cards/VideoQuestionCard';
import { ASSESSMENT_MOTION } from '../motion.constants';

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
              showBack={!isFirstQuestion || currentStep > 1}
              onContinue={
                isLastQuestion
                  ? undefined
                  : () => {
                      setDirection('forward');
                      onQuestionIndexChange((i) => i + 1);
                    }
              }
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
