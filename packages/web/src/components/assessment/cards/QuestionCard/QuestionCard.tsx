import type { AnswerValue, AssessmentQuestion, FlowStepConfig } from '@ffp/core';

import {
  ASSESSMENT_MOTION,
  AssessmentNavigation,
  QuestionRenderer,
} from '@web/components/assessment';
import { CardTransition, type CardTransitionDirection } from '@web/components/motion';

import { StepCard } from '../StepCard';

import type { ReactNode } from 'react';

export interface QuestionCardProps {
  /** Step configuration from the assessment flow */
  config: FlowStepConfig;
  /** Current question definition */
  question: AssessmentQuestion;
  /** 1-based question number */
  questionNumber: number;
  /** Total number of questions in this step */
  totalQuestions: number;
  /** Current answer value (null when unanswered) */
  value: AnswerValue | null;
  /** Callback when the answer changes */
  onAnswer: (questionId: string, value: AnswerValue | null) => void;
  /** Navigation direction for question transition animation @default 'forward' */
  direction?: CardTransitionDirection;
  /** Optional footer override (defaults to AssessmentNavigation) */
  footer?: ReactNode;
}

/**
 * Assessment question card.
 *
 * Composes StepCard with a question sub-progress indicator and
 * QuestionRenderer content. Purely presentational — the orchestrator
 * (AssessmentStepRenderer) provides the question data and callbacks.
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  config,
  question,
  questionNumber,
  totalQuestions,
  value,
  onAnswer,
  direction = 'forward',
  footer,
}) => {
  return (
    <StepCard
      title={config.title}
      description={config.description}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      footer={footer ?? <AssessmentNavigation />}
    >
      <div className="pt-5">
        <CardTransition
          transitionKey={question.id}
          direction={direction}
          duration={ASSESSMENT_MOTION.duration.questionTransition}
        >
          <QuestionRenderer question={question} value={value} onChange={onAnswer} />
        </CardTransition>
      </div>
    </StepCard>
  );
};
