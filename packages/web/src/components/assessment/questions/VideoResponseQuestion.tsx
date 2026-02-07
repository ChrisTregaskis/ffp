import { useMemo, useId } from 'react';

import type { AssessmentQuestion } from '@ffp/core';

import { RequiredIndicator } from '@web/components/form';
import { IconBadge, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

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
 * Uses basic HTML5 video element as placeholder.
 * TODO: Integrate with VideoPlayer component (FFP-141) when available.
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
      <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-muted shadow-lg">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            controlsList="nodownload"
            className="h-full w-full object-cover"
            aria-label={`Video for: ${question.question}`}
          >
            <track kind="captions" label="Captions" />
            Your browser does not support the video element.
          </video>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3">
            <IconBadge name={Icons.PLAY} size="lg" variant="secondary" />
            <Text as="p" styleProps={{ size: 'lg', weight: 'semibold', colour: 'foreground' }}>
              Video Demonstration
            </Text>
            <Text
              as="p"
              styleProps={{ size: 'sm', colour: 'muted-foreground' }}
              className="max-w-sm text-center"
            >
              In a real application, this would show an instructional video for the assessment.
            </Text>
            <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-1">
              Video placeholder — follow the written instructions above
            </Text>
          </div>
        )}
      </div>

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
