import type { AnswerValue, AssessmentQuestion, FlowStepConfig } from '@ffp/core';

import { AssessmentNavigation, QuestionRenderer } from '@web/components/assessment';
import { Text } from '@web/components/text';

import { StepCard } from '../StepCard';

import type { ReactNode } from 'react';

export interface VideoQuestionCardProps {
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
  /** Signed CloudFront URL for the video */
  videoUrl?: string;
  /** Optional footer override (defaults to AssessmentNavigation) */
  footer?: ReactNode;
}

/**
 * Assessment video question card.
 *
 * Composes StepCard with an instructions list and a video-response
 * question. The QuestionRenderer routes video-response types to the
 * VideoResponseQuestion component which handles the video player and
 * numeric input.
 */
export const VideoQuestionCard: React.FC<VideoQuestionCardProps> = ({
  config,
  question,
  questionNumber,
  totalQuestions,
  value,
  onAnswer,
  videoUrl,
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
      <div className="py-5">
        {/* Instructions card */}
        {config.instructions && config.instructions.length > 0 && (
          <div className="rounded-2xl bg-linear-to-br from-secondary/40 to-primary/10 p-5">
            <Text
              as="p"
              styleProps={{ size: 'sm', weight: 'semibold', colour: 'foreground' }}
              className="mb-3"
            >
              Instructions:
            </Text>
            <ul className="space-y-2">
              {config.instructions.map((instruction) => (
                <li key={instruction} className="flex items-start gap-2.5">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-sm text-foreground">{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Video question content */}
      <QuestionRenderer question={question} value={value} onChange={onAnswer} videoUrl={videoUrl} />
    </StepCard>
  );
};
