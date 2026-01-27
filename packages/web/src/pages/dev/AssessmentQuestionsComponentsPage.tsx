import { useState } from 'react';

import type { AssessmentQuestion, AnswerValue } from '@ffp/core';

import { SingleChoiceQuestion, MultiChoiceQuestion } from '@web/components/assessment';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import { Text, Title } from '@web/components/text';

// Mock question data for demonstrations
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

const mockOptionalQuestion: AssessmentQuestion = {
  id: 'q-single-3',
  type: 'single-choice',
  question: 'Do you have any previous experience with physiotherapy?',
  options: [
    { value: 'yes', label: 'Yes, I have had physiotherapy before' },
    { value: 'no', label: 'No, this is my first time' },
  ],
  validation: { required: false },
};

// Separate questions for error and disabled demos (different IDs to avoid radio name conflicts)
const mockErrorDemoQuestion: AssessmentQuestion = {
  ...mockSingleChoiceQuestion,
  id: 'q-single-error',
};

const mockDisabledDemoQuestion: AssessmentQuestion = {
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

/**
 * Assessment Questions components showcase page (development only).
 *
 * Demonstrates all question renderer components for FFP-139:
 * - SingleChoiceQuestion (radio buttons)
 * - MultiChoiceQuestion (checkboxes)
 * - NumericQuestion (number input) - Coming soon
 * - ScaleQuestion (1-10 scale) - Coming soon
 * - TextQuestion (textarea) - Coming soon
 * - VideoResponseQuestion (video + input) - Coming soon
 */
export const AssessmentQuestionsComponentsPage = (): JSX.Element => {
  // State for SingleChoice demos
  const [singleChoiceValue, setSingleChoiceValue] = useState<AnswerValue | undefined>(undefined);
  const [singleChoiceValue2, setSingleChoiceValue2] = useState<AnswerValue | undefined>(undefined);
  const [optionalValue, setOptionalValue] = useState<AnswerValue | undefined>(undefined);
  const [errorDemoValue, setErrorDemoValue] = useState<AnswerValue | undefined>(undefined);
  const [disabledValue] = useState<AnswerValue | undefined>('improve_mobility');

  // State for MultiChoice demos
  const [multiChoiceValue, setMultiChoiceValue] = useState<AnswerValue | undefined>([]);
  const [multiChoiceOptionalValue, setMultiChoiceOptionalValue] = useState<AnswerValue | undefined>(
    []
  );
  const [multiChoiceErrorValue, setMultiChoiceErrorValue] = useState<AnswerValue | undefined>([]);
  const [multiChoiceDisabledValue] = useState<AnswerValue | undefined>(['lower_back', 'knees']);

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
          <StatusCard title="TextQuestion" status="pending" task="FFP-217" href="#text" />
          <StatusCard title="NumericQuestion" status="pending" task="FFP-215" href="#numeric" />
          <StatusCard title="ScaleQuestion" status="pending" task="FFP-215" href="#scale" />
          <StatusCard title="VideoResponseQuestion" status="pending" task="FFP-216" href="#video" />
        </div>
      </ComponentSection>

      {/* SingleChoiceQuestion */}
      <ComponentSection title="SingleChoiceQuestion" id="single-choice">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Radio button group for selecting a single option. Supports required/optional validation,
          descriptions, and error states.
        </Text>

        {/* Basic Example */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            Basic Usage
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <SingleChoiceQuestion
              question={mockSingleChoiceQuestion}
              value={singleChoiceValue}
              onChange={setSingleChoiceValue}
            />
            <SelectedValue value={singleChoiceValue} />
          </div>
        </div>

        {/* More Options */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            More Options
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <SingleChoiceQuestion
              question={mockSingleChoiceWithManyOptions}
              value={singleChoiceValue2}
              onChange={setSingleChoiceValue2}
            />
            <SelectedValue value={singleChoiceValue2} />
          </div>
        </div>

        {/* Optional Question */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            Optional Question (no asterisk)
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <SingleChoiceQuestion
              question={mockOptionalQuestion}
              value={optionalValue}
              onChange={setOptionalValue}
            />
            <SelectedValue value={optionalValue} />
          </div>
        </div>

        {/* Error State */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            With Validation Error
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <SingleChoiceQuestion
              question={mockErrorDemoQuestion}
              value={errorDemoValue}
              onChange={setErrorDemoValue}
              error="Please select an option to continue"
            />
          </div>
        </div>

        {/* Disabled State */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            Disabled State
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <SingleChoiceQuestion
              question={mockDisabledDemoQuestion}
              value={disabledValue}
              onChange={() => {
                // No-op when disabled
              }}
              disabled
            />
          </div>
        </div>
      </ComponentSection>

      {/* MultiChoiceQuestion */}
      <ComponentSection title="MultiChoiceQuestion" id="multi-choice">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Checkbox group for selecting multiple options. Values stored as string array.
        </Text>

        {/* Basic Example */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            Basic Usage
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <MultiChoiceQuestion
              question={mockMultiChoiceQuestion}
              value={multiChoiceValue}
              onChange={setMultiChoiceValue}
            />
            <SelectedValue value={multiChoiceValue} />
          </div>
        </div>

        {/* Optional Question */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            Optional Question (no asterisk)
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <MultiChoiceQuestion
              question={mockMultiChoiceOptional}
              value={multiChoiceOptionalValue}
              onChange={setMultiChoiceOptionalValue}
            />
            <SelectedValue value={multiChoiceOptionalValue} />
          </div>
        </div>

        {/* Error State */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            With Validation Error
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <MultiChoiceQuestion
              question={mockMultiChoiceErrorDemo}
              value={multiChoiceErrorValue}
              onChange={setMultiChoiceErrorValue}
              error="Please select at least one option"
            />
          </div>
        </div>

        {/* Disabled State */}
        <div className="mb-8">
          <Title as="h3" className="mb-4" colour="card-foreground">
            Disabled State
          </Title>
          <div className="rounded-lg border border-border bg-card p-6">
            <MultiChoiceQuestion
              question={mockMultiChoiceDisabledDemo}
              value={multiChoiceDisabledValue}
              onChange={() => {
                // No-op when disabled
              }}
              disabled
            />
          </div>
        </div>
      </ComponentSection>

      {/* TextQuestion - Placeholder */}
      <ComponentSection title="TextQuestion" id="text" className="opacity-50">
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Text styleProps={{ colour: 'muted-foreground' }}>Coming in FFP-217</Text>
        </div>
      </ComponentSection>

      {/* NumericQuestion - Placeholder */}
      <ComponentSection title="NumericQuestion" id="numeric" className="opacity-50">
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Text styleProps={{ colour: 'muted-foreground' }}>Coming in FFP-215</Text>
        </div>
      </ComponentSection>

      {/* ScaleQuestion - Placeholder */}
      <ComponentSection title="ScaleQuestion" id="scale" className="opacity-50">
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Text styleProps={{ colour: 'muted-foreground' }}>Coming in FFP-215</Text>
        </div>
      </ComponentSection>

      {/* VideoResponseQuestion - Placeholder */}
      <ComponentSection title="VideoResponseQuestion" id="video" className="opacity-50">
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
          <Text styleProps={{ colour: 'muted-foreground' }}>Coming in FFP-216</Text>
        </div>
      </ComponentSection>

      {/* Developer Instructions */}
      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import question components:
            </Text>
            <code className="block rounded bg-muted p-2 text-xs">
              {`import { SingleChoiceQuestion } from '@web/components/assessment';`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Basic usage with AssessmentContext:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`const { assessmentState, assessmentDispatch } = useAssessment();

<SingleChoiceQuestion
  question={question}
  value={assessmentState.answers[question.id]?.answerValue}
  onChange={(value) => {
    assessmentDispatch({
      type: ASSESSMENT_ACTION.SET_ANSWER,
      payload: {
        questionId: question.id,
        answer: { questionId: question.id, answerValue: value }
      },
    });
  }}
  error={validationErrors[question.id]}
/>`}
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

// Helper component to show selected value
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

// Helper component for status cards
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
