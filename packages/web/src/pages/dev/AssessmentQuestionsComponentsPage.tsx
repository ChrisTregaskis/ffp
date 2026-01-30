import { useState } from 'react';

import type { AssessmentQuestion, AnswerValue } from '@ffp/core';

import {
  QuestionRenderer,
  SingleChoiceQuestion,
  MultiChoiceQuestion,
  TextQuestion,
  NumericQuestion,
  ScaleQuestion,
  VideoResponseQuestion,
} from '@web/components/assessment';
import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { Text } from '@web/components/text';

// ============================================================================
// Mock question data for demonstrations
// ============================================================================

// Single choice mock questions
const mockSingleChoiceQuestion: AssessmentQuestion = {
  id: 'q-single-1',
  type: 'single-choice',
  question: 'What is your primary goal for this programme?',
  description: 'Select the option that best describes your main objective.',
  options: [
    { value: 'reduce_pain', label: 'Reduce pain and discomfort', score: 1 },
    { value: 'improve_mobility', label: 'Improve mobility and flexibility', score: 2 },
    { value: 'build_strength', label: 'Build strength and endurance', score: 3 },
    { value: 'prevent_injury', label: 'Prevent future injuries', score: 4 },
  ],
  validation: { required: true },
};

const mockSingleChoiceWithManyOptions: AssessmentQuestion = {
  id: 'q-single-2',
  type: 'single-choice',
  question: 'How often do you currently exercise?',
  options: [
    { value: 'never', label: 'Never' },
    { value: 'rarely', label: 'Rarely (1-2 times per month)' },
    { value: 'sometimes', label: 'Sometimes (1-2 times per week)' },
    { value: 'regularly', label: 'Regularly (3-4 times per week)' },
    { value: 'daily', label: 'Daily' },
  ],
  validation: { required: true },
};

const mockSingleOptionalQuestion: AssessmentQuestion = {
  id: 'q-single-3',
  type: 'single-choice',
  question: 'Do you have any previous experience with physiotherapy?',
  options: [
    { value: 'yes', label: 'Yes, I have had physiotherapy before' },
    { value: 'no', label: 'No, this is my first time' },
  ],
  validation: { required: false },
};

const mockSingleErrorDemoQuestion: AssessmentQuestion = {
  ...mockSingleChoiceQuestion,
  id: 'q-single-error',
};

const mockSingleDisabledDemoQuestion: AssessmentQuestion = {
  ...mockSingleChoiceQuestion,
  id: 'q-single-disabled',
};

// Multi-choice mock questions
const mockMultiChoiceQuestion: AssessmentQuestion = {
  id: 'q-multi-1',
  type: 'multi-choice',
  question: 'Which areas are you experiencing discomfort?',
  description: 'Select all that apply.',
  options: [
    { value: 'lower_back', label: 'Lower back' },
    { value: 'upper_back', label: 'Upper back / shoulders' },
    { value: 'neck', label: 'Neck' },
    { value: 'knees', label: 'Knees' },
    { value: 'hips', label: 'Hips' },
    { value: 'ankles', label: 'Ankles / feet' },
  ],
  validation: { required: true },
};

const mockMultiChoiceOptional: AssessmentQuestion = {
  id: 'q-multi-2',
  type: 'multi-choice',
  question: 'Do you have any of these conditions?',
  description: 'Select all that apply, or leave blank if none.',
  options: [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'heart_condition', label: 'Heart condition' },
    { value: 'high_blood_pressure', label: 'High blood pressure' },
    { value: 'arthritis', label: 'Arthritis' },
  ],
  validation: { required: false },
};

const mockMultiChoiceErrorDemo: AssessmentQuestion = {
  ...mockMultiChoiceQuestion,
  id: 'q-multi-error',
};

const mockMultiChoiceDisabledDemo: AssessmentQuestion = {
  ...mockMultiChoiceQuestion,
  id: 'q-multi-disabled',
};

// Text question mock questions
const mockTextQuestion: AssessmentQuestion = {
  id: 'q-text-1',
  type: 'text',
  question: 'Please describe any specific concerns or goals you have for this programme',
  description: 'Share as much detail as you feel comfortable with.',
  validation: { required: true },
};

const mockTextQuestionWithMaxLength: AssessmentQuestion = {
  id: 'q-text-2',
  type: 'text',
  question: 'Briefly describe your current exercise routine',
  description: 'Keep it concise (max 200 characters).',
  validation: { required: true, max: 200 },
};

const mockTextQuestionOptional: AssessmentQuestion = {
  id: 'q-text-3',
  type: 'text',
  question: 'Is there anything else you would like us to know?',
  description: 'This is optional.',
  validation: { required: false },
};

const mockTextQuestionErrorDemo: AssessmentQuestion = {
  ...mockTextQuestion,
  id: 'q-text-error',
};

const mockTextQuestionDisabledDemo: AssessmentQuestion = {
  ...mockTextQuestion,
  id: 'q-text-disabled',
};

// Numeric question mock questions
const mockNumericQuestion: AssessmentQuestion = {
  id: 'q-numeric-1',
  type: 'numeric',
  question: 'How many repetitions can you complete comfortably?',
  description: 'Enter a number between 0 and 100.',
  validation: { required: true, min: 0, max: 100 },
};

const mockNumericQuestionNoLimits: AssessmentQuestion = {
  id: 'q-numeric-2',
  type: 'numeric',
  question: 'How many years have you been active?',
  validation: { required: true },
};

const mockNumericQuestionOptional: AssessmentQuestion = {
  id: 'q-numeric-3',
  type: 'numeric',
  question: 'How many days per week do you exercise?',
  description: 'Optional - leave blank if you prefer not to answer.',
  validation: { required: false, min: 0, max: 7 },
};

const mockNumericQuestionErrorDemo: AssessmentQuestion = {
  ...mockNumericQuestion,
  id: 'q-numeric-error',
};

const mockNumericQuestionDisabledDemo: AssessmentQuestion = {
  ...mockNumericQuestion,
  id: 'q-numeric-disabled',
};

// Scale question mock questions
const mockScaleQuestion: AssessmentQuestion = {
  id: 'q-scale-1',
  type: 'scale',
  question: 'How would you rate your current pain level?',
  description: 'Select a number from 1 (no pain) to 10 (severe pain).',
  validation: { required: true },
};

const mockScaleQuestionCustomRange: AssessmentQuestion = {
  id: 'q-scale-2',
  type: 'scale',
  question: 'How satisfied are you with your progress?',
  description: 'Rate from 1 to 5.',
  validation: { required: true, min: 1, max: 5 },
};

const mockScaleQuestionOptional: AssessmentQuestion = {
  id: 'q-scale-3',
  type: 'scale',
  question: 'How confident do you feel about the exercises?',
  validation: { required: false },
};

const mockScaleQuestionErrorDemo: AssessmentQuestion = {
  ...mockScaleQuestion,
  id: 'q-scale-error',
};

const mockScaleQuestionDisabledDemo: AssessmentQuestion = {
  ...mockScaleQuestion,
  id: 'q-scale-disabled',
};

// Video response mock questions
const mockVideoResponseQuestion: AssessmentQuestion = {
  id: 'q-video-1',
  type: 'video-response',
  question: 'Complete as many squats as you can in 30 seconds',
  description:
    'Watch the video for proper form, then enter the number of repetitions you completed.',
  videoId: '00000000-0000-0000-0000-000000000001',
  validation: { required: true, min: 0, max: 100 },
};

const mockVideoResponseNoVideo: AssessmentQuestion = {
  id: 'q-video-2',
  type: 'video-response',
  question: 'Hold a plank position for as long as possible',
  description: 'Enter the duration in seconds.',
  videoId: '00000000-0000-0000-0000-000000000002',
  validation: { required: true, min: 0 },
};

const mockVideoResponseOptional: AssessmentQuestion = {
  id: 'q-video-3',
  type: 'video-response',
  question: 'Optional: Complete the balance test',
  description: 'This exercise is optional. Enter your result if you completed it.',
  videoId: '00000000-0000-0000-0000-000000000003',
  validation: { required: false, min: 0, max: 60 },
};

const mockVideoResponseErrorDemo: AssessmentQuestion = {
  ...mockVideoResponseQuestion,
  id: 'q-video-error',
};

const mockVideoResponseDisabledDemo: AssessmentQuestion = {
  ...mockVideoResponseQuestion,
  id: 'q-video-disabled',
};

// QuestionRenderer mock questions (unique IDs to avoid form element collisions)
const mockRendererSingleChoice: AssessmentQuestion = {
  ...mockSingleChoiceQuestion,
  id: 'q-renderer-single',
};

const mockRendererMultiChoice: AssessmentQuestion = {
  ...mockMultiChoiceQuestion,
  id: 'q-renderer-multi',
};

const mockRendererText: AssessmentQuestion = {
  ...mockTextQuestion,
  id: 'q-renderer-text',
};

const mockRendererNumeric: AssessmentQuestion = {
  ...mockNumericQuestion,
  id: 'q-renderer-numeric',
};

const mockRendererScale: AssessmentQuestion = {
  ...mockScaleQuestion,
  id: 'q-renderer-scale',
};

const mockRendererVideoResponse: AssessmentQuestion = {
  ...mockVideoResponseQuestion,
  id: 'q-renderer-video',
};

// Sample video URL for demo (Big Buck Bunny - public domain)
const DEMO_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';

// ============================================================================
// Page Component
// ============================================================================

/**
 * Assessment Questions components showcase page (development only).
 *
 * Demonstrates all question renderer components for FFP-139:
 * - SingleChoiceQuestion (radio buttons)
 * - MultiChoiceQuestion (checkboxes)
 * - TextQuestion (textarea)
 * - NumericQuestion (number input) - Coming soon
 * - ScaleQuestion (1-10 scale) - Coming soon
 * - VideoResponseQuestion (video + input) - Coming soon
 */
export const AssessmentQuestionsComponentsPage = (): JSX.Element => {
  // State for SingleChoice demos
  const [singleBasicValue, setSingleBasicValue] = useState<AnswerValue | undefined>(undefined);
  const [singleManyOptionsValue, setSingleManyOptionsValue] = useState<AnswerValue | undefined>(
    undefined
  );
  const [singleOptionalValue, setSingleOptionalValue] = useState<AnswerValue | undefined>(
    undefined
  );
  const [singleErrorValue, setSingleErrorValue] = useState<AnswerValue | undefined>(undefined);
  const [singleDisabledValue] = useState<AnswerValue | undefined>('improve_mobility');

  // State for MultiChoice demos
  const [multiBasicValue, setMultiBasicValue] = useState<AnswerValue | undefined>([]);
  const [multiOptionalValue, setMultiOptionalValue] = useState<AnswerValue | undefined>([]);
  const [multiErrorValue, setMultiErrorValue] = useState<AnswerValue | undefined>([]);
  const [multiDisabledValue] = useState<AnswerValue | undefined>(['lower_back', 'knees']);

  // State for TextQuestion demos
  const [textBasicValue, setTextBasicValue] = useState<AnswerValue | undefined>('');
  const [textMaxLengthValue, setTextMaxLengthValue] = useState<AnswerValue | undefined>('');
  const [textOptionalValue, setTextOptionalValue] = useState<AnswerValue | undefined>('');
  const [textErrorValue, setTextErrorValue] = useState<AnswerValue | undefined>('');
  const [textDisabledValue] = useState<AnswerValue | undefined>(
    'I have been experiencing lower back pain for the past 3 months...'
  );

  // State for NumericQuestion demos
  const [numericBasicValue, setNumericBasicValue] = useState<AnswerValue | undefined>(undefined);
  const [numericNoLimitsValue, setNumericNoLimitsValue] = useState<AnswerValue | undefined>(
    undefined
  );
  const [numericOptionalValue, setNumericOptionalValue] = useState<AnswerValue | undefined>(
    undefined
  );
  const [numericErrorValue, setNumericErrorValue] = useState<AnswerValue | undefined>(undefined);
  const [numericDisabledValue] = useState<AnswerValue | undefined>(25);

  // State for ScaleQuestion demos
  const [scaleBasicValue, setScaleBasicValue] = useState<AnswerValue | undefined>(undefined);
  const [scaleCustomRangeValue, setScaleCustomRangeValue] = useState<AnswerValue | undefined>(
    undefined
  );
  const [scaleOptionalValue, setScaleOptionalValue] = useState<AnswerValue | undefined>(undefined);
  const [scaleErrorValue, setScaleErrorValue] = useState<AnswerValue | undefined>(undefined);
  const [scaleDisabledValue] = useState<AnswerValue | undefined>(7);

  // State for VideoResponseQuestion demos
  const [videoBasicValue, setVideoBasicValue] = useState<AnswerValue | undefined>(undefined);
  const [videoNoVideoValue, setVideoNoVideoValue] = useState<AnswerValue | undefined>(undefined);
  const [videoOptionalValue, setVideoOptionalValue] = useState<AnswerValue | undefined>(undefined);
  const [videoErrorValue, setVideoErrorValue] = useState<AnswerValue | undefined>(undefined);
  const [videoDisabledValue] = useState<AnswerValue | undefined>(15);

  // State for QuestionRenderer demos
  const [rendererValues, setRendererValues] = useState<Record<string, AnswerValue | undefined>>({});

  const handleRendererChange = (questionId: string, value: AnswerValue): void => {
    setRendererValues((prev) => ({ ...prev, [questionId]: value }));
  };

  // Tab configurations
  const singleChoiceTabs: DemoTab[] = [
    {
      id: 'basic',
      label: 'Basic',
      content: (
        <>
          <SingleChoiceQuestion
            question={mockSingleChoiceQuestion}
            value={singleBasicValue}
            onChange={setSingleBasicValue}
          />
          <SelectedValue value={singleBasicValue} />
        </>
      ),
    },
    {
      id: 'many-options',
      label: 'Many Options',
      content: (
        <>
          <SingleChoiceQuestion
            question={mockSingleChoiceWithManyOptions}
            value={singleManyOptionsValue}
            onChange={setSingleManyOptionsValue}
          />
          <SelectedValue value={singleManyOptionsValue} />
        </>
      ),
    },
    {
      id: 'optional',
      label: 'Optional',
      content: (
        <>
          <SingleChoiceQuestion
            question={mockSingleOptionalQuestion}
            value={singleOptionalValue}
            onChange={setSingleOptionalValue}
          />
          <SelectedValue value={singleOptionalValue} />
        </>
      ),
    },
    {
      id: 'error',
      label: 'Error',
      content: (
        <SingleChoiceQuestion
          question={mockSingleErrorDemoQuestion}
          value={singleErrorValue}
          onChange={setSingleErrorValue}
          error="Please select an option to continue"
        />
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <SingleChoiceQuestion
          question={mockSingleDisabledDemoQuestion}
          value={singleDisabledValue}
          onChange={() => {
            // No-op when disabled
          }}
          disabled
        />
      ),
    },
  ];

  const multiChoiceTabs: DemoTab[] = [
    {
      id: 'basic',
      label: 'Basic',
      content: (
        <>
          <MultiChoiceQuestion
            question={mockMultiChoiceQuestion}
            value={multiBasicValue}
            onChange={setMultiBasicValue}
          />
          <SelectedValue value={multiBasicValue} />
        </>
      ),
    },
    {
      id: 'optional',
      label: 'Optional',
      content: (
        <>
          <MultiChoiceQuestion
            question={mockMultiChoiceOptional}
            value={multiOptionalValue}
            onChange={setMultiOptionalValue}
          />
          <SelectedValue value={multiOptionalValue} />
        </>
      ),
    },
    {
      id: 'error',
      label: 'Error',
      content: (
        <MultiChoiceQuestion
          question={mockMultiChoiceErrorDemo}
          value={multiErrorValue}
          onChange={setMultiErrorValue}
          error="Please select at least one option"
        />
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <MultiChoiceQuestion
          question={mockMultiChoiceDisabledDemo}
          value={multiDisabledValue}
          onChange={() => {
            // No-op when disabled
          }}
          disabled
        />
      ),
    },
  ];

  const textQuestionTabs: DemoTab[] = [
    {
      id: 'basic',
      label: 'Basic',
      content: (
        <>
          <TextQuestion
            question={mockTextQuestion}
            value={textBasicValue}
            onChange={setTextBasicValue}
          />
          <SelectedValue value={textBasicValue} />
        </>
      ),
    },
    {
      id: 'max-length',
      label: 'Max Length',
      content: (
        <>
          <TextQuestion
            question={mockTextQuestionWithMaxLength}
            value={textMaxLengthValue}
            onChange={setTextMaxLengthValue}
          />
          <SelectedValue value={textMaxLengthValue} />
        </>
      ),
    },
    {
      id: 'optional',
      label: 'Optional',
      content: (
        <>
          <TextQuestion
            question={mockTextQuestionOptional}
            value={textOptionalValue}
            onChange={setTextOptionalValue}
          />
          <SelectedValue value={textOptionalValue} />
        </>
      ),
    },
    {
      id: 'error',
      label: 'Error',
      content: (
        <TextQuestion
          question={mockTextQuestionErrorDemo}
          value={textErrorValue}
          onChange={setTextErrorValue}
          error="Please provide a response to continue"
        />
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <TextQuestion
          question={mockTextQuestionDisabledDemo}
          value={textDisabledValue}
          onChange={() => {
            // No-op when disabled
          }}
          disabled
        />
      ),
    },
  ];

  const numericQuestionTabs: DemoTab[] = [
    {
      id: 'basic',
      label: 'Basic',
      content: (
        <>
          <NumericQuestion
            question={mockNumericQuestion}
            value={numericBasicValue}
            onChange={setNumericBasicValue}
          />
          <SelectedValue value={numericBasicValue} />
        </>
      ),
    },
    {
      id: 'no-limits',
      label: 'No Limits',
      content: (
        <>
          <NumericQuestion
            question={mockNumericQuestionNoLimits}
            value={numericNoLimitsValue}
            onChange={setNumericNoLimitsValue}
          />
          <SelectedValue value={numericNoLimitsValue} />
        </>
      ),
    },
    {
      id: 'optional',
      label: 'Optional',
      content: (
        <>
          <NumericQuestion
            question={mockNumericQuestionOptional}
            value={numericOptionalValue}
            onChange={setNumericOptionalValue}
          />
          <SelectedValue value={numericOptionalValue} />
        </>
      ),
    },
    {
      id: 'error',
      label: 'Error',
      content: (
        <NumericQuestion
          question={mockNumericQuestionErrorDemo}
          value={numericErrorValue}
          onChange={setNumericErrorValue}
          error="Please enter a valid number"
        />
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <NumericQuestion
          question={mockNumericQuestionDisabledDemo}
          value={numericDisabledValue}
          onChange={() => {
            // No-op when disabled
          }}
          disabled
        />
      ),
    },
  ];

  const scaleQuestionTabs: DemoTab[] = [
    {
      id: 'basic',
      label: 'Basic (1-10)',
      content: (
        <>
          <ScaleQuestion
            question={mockScaleQuestion}
            value={scaleBasicValue}
            onChange={setScaleBasicValue}
          />
          <SelectedValue value={scaleBasicValue} />
        </>
      ),
    },
    {
      id: 'custom-range',
      label: 'Custom (1-5)',
      content: (
        <>
          <ScaleQuestion
            question={mockScaleQuestionCustomRange}
            value={scaleCustomRangeValue}
            onChange={setScaleCustomRangeValue}
          />
          <SelectedValue value={scaleCustomRangeValue} />
        </>
      ),
    },
    {
      id: 'optional',
      label: 'Optional',
      content: (
        <>
          <ScaleQuestion
            question={mockScaleQuestionOptional}
            value={scaleOptionalValue}
            onChange={setScaleOptionalValue}
          />
          <SelectedValue value={scaleOptionalValue} />
        </>
      ),
    },
    {
      id: 'error',
      label: 'Error',
      content: (
        <ScaleQuestion
          question={mockScaleQuestionErrorDemo}
          value={scaleErrorValue}
          onChange={setScaleErrorValue}
          error="Please select a rating to continue"
        />
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <ScaleQuestion
          question={mockScaleQuestionDisabledDemo}
          value={scaleDisabledValue}
          onChange={() => {
            // No-op when disabled
          }}
          disabled
        />
      ),
    },
  ];

  const videoResponseTabs: DemoTab[] = [
    {
      id: 'basic',
      label: 'With Video',
      content: (
        <>
          <VideoResponseQuestion
            question={mockVideoResponseQuestion}
            value={videoBasicValue}
            onChange={setVideoBasicValue}
            videoUrl={DEMO_VIDEO_URL}
          />
          <SelectedValue value={videoBasicValue} />
        </>
      ),
    },
    {
      id: 'no-video',
      label: 'No Video',
      content: (
        <>
          <VideoResponseQuestion
            question={mockVideoResponseNoVideo}
            value={videoNoVideoValue}
            onChange={setVideoNoVideoValue}
          />
          <SelectedValue value={videoNoVideoValue} />
        </>
      ),
    },
    {
      id: 'optional',
      label: 'Optional',
      content: (
        <>
          <VideoResponseQuestion
            question={mockVideoResponseOptional}
            value={videoOptionalValue}
            onChange={setVideoOptionalValue}
            videoUrl={DEMO_VIDEO_URL}
          />
          <SelectedValue value={videoOptionalValue} />
        </>
      ),
    },
    {
      id: 'error',
      label: 'Error',
      content: (
        <VideoResponseQuestion
          question={mockVideoResponseErrorDemo}
          value={videoErrorValue}
          onChange={setVideoErrorValue}
          videoUrl={DEMO_VIDEO_URL}
          error="Please enter your result to continue"
        />
      ),
    },
    {
      id: 'disabled',
      label: 'Disabled',
      content: (
        <VideoResponseQuestion
          question={mockVideoResponseDisabledDemo}
          value={videoDisabledValue}
          onChange={() => {
            // No-op when disabled
          }}
          videoUrl={DEMO_VIDEO_URL}
          disabled
        />
      ),
    },
  ];

  const questionRendererTabs: DemoTab[] = [
    {
      id: 'single-choice',
      label: 'Single Choice',
      content: (
        <>
          <QuestionRenderer
            question={mockRendererSingleChoice}
            value={rendererValues[mockRendererSingleChoice.id]}
            onChange={handleRendererChange}
          />
          <SelectedValue value={rendererValues[mockRendererSingleChoice.id]} />
        </>
      ),
    },
    {
      id: 'multi-choice',
      label: 'Multi Choice',
      content: (
        <>
          <QuestionRenderer
            question={mockRendererMultiChoice}
            value={rendererValues[mockRendererMultiChoice.id]}
            onChange={handleRendererChange}
          />
          <SelectedValue value={rendererValues[mockRendererMultiChoice.id]} />
        </>
      ),
    },
    {
      id: 'text',
      label: 'Text',
      content: (
        <>
          <QuestionRenderer
            question={mockRendererText}
            value={rendererValues[mockRendererText.id]}
            onChange={handleRendererChange}
          />
          <SelectedValue value={rendererValues[mockRendererText.id]} />
        </>
      ),
    },
    {
      id: 'numeric',
      label: 'Numeric',
      content: (
        <>
          <QuestionRenderer
            question={mockRendererNumeric}
            value={rendererValues[mockRendererNumeric.id]}
            onChange={handleRendererChange}
          />
          <SelectedValue value={rendererValues[mockRendererNumeric.id]} />
        </>
      ),
    },
    {
      id: 'scale',
      label: 'Scale',
      content: (
        <>
          <QuestionRenderer
            question={mockRendererScale}
            value={rendererValues[mockRendererScale.id]}
            onChange={handleRendererChange}
          />
          <SelectedValue value={rendererValues[mockRendererScale.id]} />
        </>
      ),
    },
    {
      id: 'video-response',
      label: 'Video Response',
      content: (
        <>
          <QuestionRenderer
            question={mockRendererVideoResponse}
            value={rendererValues[mockRendererVideoResponse.id]}
            onChange={handleRendererChange}
            videoUrl={DEMO_VIDEO_URL}
          />
          <SelectedValue value={rendererValues[mockRendererVideoResponse.id]} />
        </>
      ),
    },
  ];

  return (
    <ComponentPageWrapper maxWidth="4xl">
      <ComponentPageHeader
        title="Assessment Question Components"
        description="Question renderer components for assessment flows (FFP-139)"
        showBackLink
      />

      {/* Implementation Status */}
      <ComponentSection title="Implementation Status">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatusCard title="SingleChoiceQuestion" status="complete" href="#single-choice" />
          <StatusCard title="MultiChoiceQuestion" status="complete" href="#multi-choice" />
          <StatusCard title="TextQuestion" status="complete" href="#text" />
          <StatusCard title="NumericQuestion" status="complete" href="#numeric" />
          <StatusCard title="ScaleQuestion" status="complete" href="#scale" />
          <StatusCard title="VideoResponseQuestion" status="complete" href="#video" />
          <StatusCard title="QuestionRenderer" status="complete" href="#renderer" />
        </div>
      </ComponentSection>

      {/* SingleChoiceQuestion */}
      <ComponentSection title="SingleChoiceQuestion" id="single-choice">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Radio button group for selecting a single option. Supports required/optional validation,
          descriptions, and error states.
        </Text>
        <DemoTabs tabs={singleChoiceTabs} />
      </ComponentSection>

      {/* MultiChoiceQuestion */}
      <ComponentSection title="MultiChoiceQuestion" id="multi-choice">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Checkbox group for selecting multiple options. Values stored as string array.
        </Text>
        <DemoTabs tabs={multiChoiceTabs} />
      </ComponentSection>

      {/* TextQuestion */}
      <ComponentSection title="TextQuestion" id="text">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Textarea input for free-text responses. Supports max character limit via validation.max.
        </Text>
        <DemoTabs tabs={textQuestionTabs} />
      </ComponentSection>

      {/* NumericQuestion */}
      <ComponentSection title="NumericQuestion" id="numeric">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Number input with stepper buttons. Supports min/max validation via validation.min and
          validation.max.
        </Text>
        <DemoTabs tabs={numericQuestionTabs} />
      </ComponentSection>

      {/* ScaleQuestion */}
      <ComponentSection title="ScaleQuestion" id="scale">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Button scale for ratings. Defaults to 1-10, customisable via validation.min and
          validation.max.
        </Text>
        <DemoTabs tabs={scaleQuestionTabs} />
      </ComponentSection>

      {/* VideoResponseQuestion */}
      <ComponentSection title="VideoResponseQuestion" id="video">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Video player with numeric response input. Uses HTML5 video as placeholder (VideoPlayer
          component FFP-141 pending).
        </Text>
        <DemoTabs tabs={videoResponseTabs} />
      </ComponentSection>

      {/* QuestionRenderer */}
      <ComponentSection title="QuestionRenderer" id="renderer">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Factory component that routes to the correct question renderer based on question.type.
          Wraps onChange to include questionId for AssessmentContext dispatch.
        </Text>
        <DemoTabs tabs={questionRendererTabs} />
      </ComponentSection>

      {/* Developer Instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import QuestionRenderer (recommended):
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { QuestionRenderer } from '@web/components/assessment';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              QuestionRenderer with AssessmentContext:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`const { assessmentState, assessmentDispatch } = useAssessment();

<QuestionRenderer
  question={question}
  value={assessmentState.answers[question.id]?.answerValue}
  onChange={(questionId, value) => {
    assessmentDispatch({
      type: ASSESSMENT_ACTION.SET_ANSWER,
      payload: { questionId, answer: { questionId, answerValue: value } },
    });
  }}
  videoUrl={videoUrls[question.videoId]}
  error={validationErrors[question.id]}
/>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Or import individual components directly:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { SingleChoiceQuestion } from '@web/components/assessment';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              QuestionComponentProps interface:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`interface QuestionComponentProps {
  question: AssessmentQuestion;  // Question definition
  value: AnswerValue | undefined; // Current answer
  onChange: (value: AnswerValue) => void; // Change handler
  disabled?: boolean;  // Read-only mode
  error?: string;      // Validation error
}`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              RequiredIndicator component (reusable):
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`import { RequiredIndicator } from '@web/components/form';

<label>
  Email address <RequiredIndicator />
</label>`}
            </code>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// Helper Components
// ============================================================================

/** Helper component to show selected value */
const SelectedValue: React.FC<{ value: AnswerValue | undefined }> = ({ value }) => (
  <div className="mt-4 rounded bg-muted p-3">
    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
      Selected value:{' '}
      <code className="rounded bg-background px-1">
        {value !== undefined ? String(value) : 'undefined'}
      </code>
    </Text>
  </div>
);

/** Helper component for status cards */
const StatusCard: React.FC<{
  title: string;
  status: 'complete' | 'pending';
  task?: string;
  href?: string;
}> = ({ title, status, task, href }) => {
  const content = (
    <div className="flex items-center justify-between">
      <Text styleProps={{ size: 'sm', weight: 'medium' }}>{title}</Text>
      {status === 'complete' ? (
        <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs text-success">Done</span>
      ) : (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {task}
        </span>
      )}
    </div>
  );

  const baseClassName = `block rounded-lg border p-3 transition-colors ${
    status === 'complete' ? 'border-success/30 bg-success/5' : 'border-border bg-muted/30'
  }`;

  if (href) {
    return (
      <a href={href} className={`${baseClassName} hover:bg-accent/50`}>
        {content}
      </a>
    );
  }

  return <div className={baseClassName}>{content}</div>;
};
