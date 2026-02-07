import type { AnswerValue, AssessmentQuestion, FlowStepConfig } from '@ffp/core';

import { QuestionRenderer } from '@web/components/assessment';
import { Text } from '@web/components/text';

export interface QuestionScreenProps {
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
}

/**
 * Assessment question screen.
 *
 * Thin wrapper around QuestionRenderer that adds a question number
 * indicator and step context. Purely presentational — the orchestrator
 * (AssessmentStepRenderer) provides the question data and callbacks.
 */
export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  config,
  question,
  questionNumber,
  totalQuestions,
  value,
  onAnswer,
}) => {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Step heading */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ffp-navy">{config.title}</h1>
        {config.description && (
          <p className="mt-3 text-lg text-muted-foreground">{config.description}</p>
        )}
      </div>

      {/* Question number indicator */}
      <div className="flex items-center justify-center">
        <Text as="span" styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
          Question {questionNumber} of {totalQuestions}
        </Text>
      </div>

      {/* Question content */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
        <QuestionRenderer question={question} value={value} onChange={onAnswer} />
      </div>
    </div>
  );
};
