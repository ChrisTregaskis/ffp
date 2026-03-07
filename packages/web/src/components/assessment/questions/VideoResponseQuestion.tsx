import { useMemo, useId } from 'react';

import type { AssessmentQuestion } from '@ffp/core';

import { RequiredIndicator } from '@web/components/form';
import { Text } from '@web/components/text';
import { VideoPlayer } from '@web/components/video';

import { NumericQuestion } from './NumericQuestion';

import type { QuestionComponentProps } from './types';

/**
 * Extended props for VideoResponseQuestion.
 * Includes videoUrl which parent fetches using question.videoId.
 */
export interface VideoResponseQuestionProps extends QuestionComponentProps {
  /** Signed CloudFront URL for the video (parent fetches using question.videoId) */
  videoUrl?: string;
}

/**
 * Video response question component - renders video player with numeric response input.
 *
 * Displays a video for the user to watch/follow, then captures a numeric response
 * (e.g., number of repetitions completed, duration held).
 *
 * Uses VideoPlayer component which handles signed URL fetching when given a videoId,
 * or accepts a direct src URL.
 */
export const VideoResponseQuestion: React.FC<VideoResponseQuestionProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  error,
  videoUrl,
}) => {
  const instanceId = useId();
  const questionId = `question-${question.id}-${instanceId}`;
  const descriptionId = question.description ? `${questionId}-description` : undefined;
  const isRequired = question.validation?.required !== false;

  // Sub-question for the numeric input (unique ID, simplified text)
  const numericQuestion: AssessmentQuestion = useMemo(
    () => ({
      ...question,
      id: `${question.id}-response`,
      question: 'Enter your result:',
      description: undefined,
    }),
    [question]
  );

  return (
    <div className="space-y-5" aria-describedby={descriptionId}>
      {/* Question text */}
      <div className="space-y-1">
        <Text
          as="p"
          styleProps={{ size: 'xl', weight: 'medium', colour: 'foreground' }}
          className="leading-relaxed"
        >
          {question.question}
          {isRequired && <RequiredIndicator />}
        </Text>

        {/* Description / helper text */}
        {question.description && (
          <Text as="p" id={descriptionId} styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
            {question.description}
          </Text>
        )}
      </div>

      {/* Video player */}
      <VideoPlayer
        videoId={question.videoId}
        src={videoUrl}
        className="border border-border shadow-lg"
        ariaLabel={`Video for: ${question.question}`}
      />

      {/* Numeric response - delegates to NumericQuestion */}
      <div className="border-t border-border pt-4">
        <NumericQuestion
          question={numericQuestion}
          value={value}
          onChange={onChange}
          disabled={disabled}
          error={error}
        />
      </div>
    </div>
  );
};
