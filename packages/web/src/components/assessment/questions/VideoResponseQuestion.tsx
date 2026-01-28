import { useCallback, useId } from 'react';

import { RequiredIndicator } from '@web/components/form';
import { Text } from '@web/components/text';

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
  const errorId = `${questionId}-error`;
  const descriptionId = question.description ? `${questionId}-description` : undefined;
  const isRequired = question.validation?.required !== false;

  // Parse current value as number (or undefined)
  const currentValue = typeof value === 'number' ? value : undefined;

  const minValue = question.validation?.min;
  const maxValue = question.validation?.max;

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (disabled) return;

      const inputValue = event.target.value;

      // Allow empty input (clearing the field)
      if (inputValue === '') {
        onChange(undefined as unknown as number);
        return;
      }

      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        onChange(numericValue);
      }
    },
    [disabled, onChange]
  );

  return (
    <fieldset
      className="space-y-5"
      aria-describedby={
        [descriptionId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
      }
    >
      <legend className="sr-only">{question.question}</legend>

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
      <div className="aspect-video overflow-hidden rounded-lg bg-muted">
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
          <div className="flex h-full w-full items-center justify-center">
            <Text styleProps={{ colour: 'muted-foreground' }}>Video not available</Text>
          </div>
        )}
      </div>

      {/* Numeric response input */}
      <div className="space-y-3 border-t border-border pt-4">
        <label htmlFor={questionId} className="block text-base font-medium text-foreground">
          Enter your result:
        </label>

        <div className="flex items-center gap-2">
          <input
            type="number"
            id={questionId}
            value={currentValue ?? ''}
            onChange={handleInputChange}
            disabled={disabled}
            min={minValue}
            max={maxValue}
            aria-invalid={!!error}
            aria-describedby={
              [descriptionId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined
            }
            aria-required={isRequired}
            placeholder="0"
            className={`
              h-12 w-24 rounded-lg border-2 bg-card px-4 text-center text-lg font-medium
              transition-colors duration-200
              placeholder:text-muted-foreground/60
              focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
              [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
              ${
                error !== undefined
                  ? 'border-destructive focus:border-destructive'
                  : 'border-border focus:border-primary'
              }
              ${disabled ? 'cursor-not-allowed bg-muted opacity-60' : ''}
            `}
          />

          {/* Range indicator */}
          {minValue !== undefined && maxValue !== undefined && (
            <Text as="span" styleProps={{ size: 'lg', colour: 'muted-foreground' }}>
              {String(minValue)}/{String(maxValue)}
            </Text>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Text
          as="p"
          id={errorId}
          styleProps={{ size: 'sm', colour: 'destructive' }}
          role="alert"
          className="animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {error}
        </Text>
      )}
    </fieldset>
  );
};
