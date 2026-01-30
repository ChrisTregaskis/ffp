import { useCallback } from 'react';

import type { AnswerValue, AssessmentQuestion } from '@ffp/core';

import { Text } from '@web/components/text';

import { MultiChoiceQuestion } from './MultiChoiceQuestion';
import { NumericQuestion } from './NumericQuestion';
import { ScaleQuestion } from './ScaleQuestion';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { TextQuestion } from './TextQuestion';
import { VideoResponseQuestion } from './VideoResponseQuestion';

import type { QuestionComponentProps } from './types';

/** Props for the QuestionRenderer factory component. */
export interface QuestionRendererProps {
  /** Question definition from the assessment template */
  question: AssessmentQuestion;
  /** Current answer value (undefined if not yet answered) */
  value: AnswerValue | undefined;
  /** Callback fired when the answer changes (includes questionId for dispatch) */
  onChange: (questionId: string, value: AnswerValue) => void;
  /** Whether the question input is disabled */
  disabled?: boolean;
  /** Validation error message to display */
  error?: string;
  /** Signed CloudFront URL for video-response questions */
  videoUrl?: string;
}

/**
 * Factory component that routes to the correct question renderer
 * based on question.type.
 *
 * Wraps individual question components by:
 * - Adding questionId to the onChange callback for dispatch
 * - Passing videoUrl through for video-response questions
 * - Handling unknown question types with a fallback
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  error,
  videoUrl,
}) => {
  const handleChange = useCallback(
    (newValue: AnswerValue) => {
      onChange(question.id, newValue);
    },
    [onChange, question.id]
  );

  const commonProps: QuestionComponentProps = {
    question,
    value,
    onChange: handleChange,
    disabled,
    error,
  };

  switch (question.type) {
    case 'single-choice':
      return <SingleChoiceQuestion {...commonProps} />;
    case 'multi-choice':
      return <MultiChoiceQuestion {...commonProps} />;
    case 'numeric':
      return <NumericQuestion {...commonProps} />;
    case 'text':
      return <TextQuestion {...commonProps} />;
    case 'scale':
      return <ScaleQuestion {...commonProps} />;
    case 'video-response':
      return <VideoResponseQuestion {...commonProps} videoUrl={videoUrl} />;
    default: {
      const _exhaustiveCheck: never = question.type;
      return <UnsupportedQuestion questionType={_exhaustiveCheck as string} />;
    }
  }
};

/** Fallback component for unsupported question types. */
const UnsupportedQuestion: React.FC<{ questionType: string }> = ({ questionType }) => (
  <div
    role="alert"
    className="rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-center"
  >
    <Text styleProps={{ colour: 'muted-foreground' }}>
      Unsupported question type: <code className="rounded bg-background px-1">{questionType}</code>
    </Text>
  </div>
);
